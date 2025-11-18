"""
Streaming Router
Handles real-time video and audio streaming from Electron frontend to backend.
Supports three independent streams: Video, System Audio, and Microphone Audio.
"""

import logging
import os
import asyncio
import json
from datetime import datetime
from typing import Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Header, HTTPException, status, Depends

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/streaming")

# Store active streaming sessions
active_sessions: Dict[str, dict] = {}

# Get internal API key from environment
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")


def verify_internal_api_key(x_api_key: str = Header(...)):
    """
    Verify that the request contains a valid internal API key.
    
    Args:
        x_api_key: API key from request header
        
    Raises:
        HTTPException: If API key is invalid or missing
    """
    if x_api_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )


@router.websocket("/ws/video/{session_id}")
async def video_stream_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for video stream.
    
    Receives video frames from the client and processes them in real-time.
    This stream handles screen recording video data.
    
    Args:
        websocket: WebSocket connection
        session_id: Unique session identifier for this recording session
        
    Protocol:
        Client sends:
        - Binary data: Video frame chunks
        - JSON control messages: {"type": "control", "action": "pause|resume|stop"}
        
        Server sends:
        - JSON status updates: {"type": "status", "message": "...", "received_bytes": int}
        - JSON errors: {"type": "error", "message": "..."}
    """
    await websocket.accept()
    logger.info(f"Video stream connected for session {session_id}")
    
    # Initialize session tracking
    if session_id not in active_sessions:
        active_sessions[session_id] = {
            "video": {"connected": True, "bytes_received": 0, "chunks": 0},
            "system_audio": {"connected": False, "bytes_received": 0, "chunks": 0},
            "microphone": {"connected": False, "bytes_received": 0, "chunks": 0},
            "start_time": datetime.now().isoformat()
        }
    else:
        active_sessions[session_id]["video"]["connected"] = True
    
    total_bytes = 0
    chunk_count = 0
    
    try:
        while True:
            # Receive data from client
            message = await websocket.receive()
            
            if "bytes" in message:
                # Binary video data
                video_chunk = message["bytes"]
                chunk_size = len(video_chunk)
                total_bytes += chunk_size
                chunk_count += 1
                
                # Update session stats
                active_sessions[session_id]["video"]["bytes_received"] = total_bytes
                active_sessions[session_id]["video"]["chunks"] = chunk_count
                
                # TODO: Process video chunk (e.g., save to file, analyze, compress)
                # For now, just log receipt
                if chunk_count % 10 == 0:  # Log every 10th chunk to avoid spam
                    logger.debug(f"Session {session_id} - Video: {chunk_count} chunks, {total_bytes} bytes")
                    await websocket.send_json({
                        "type": "status",
                        "message": "Video chunk received",
                        "received_bytes": total_bytes,
                        "chunk_count": chunk_count
                    })
                    
            elif "text" in message:
                # Control message
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")
                    
                    if msg_type == "control":
                        action = data.get("action")
                        logger.info(f"Video stream control: {action} for session {session_id}")
                        await websocket.send_json({
                            "type": "control_ack",
                            "action": action,
                            "status": "ok"
                        })
                    elif msg_type == "end":
                        logger.info(f"Video stream end signal for session {session_id}")
                        break
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON in control message"
                    })
                    
    except WebSocketDisconnect:
        logger.info(f"Video stream disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"Video stream error for session {session_id}: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        # Clean up
        if session_id in active_sessions:
            active_sessions[session_id]["video"]["connected"] = False
        await websocket.close()
        logger.info(f"Video stream closed for session {session_id}. Total: {total_bytes} bytes, {chunk_count} chunks")


@router.websocket("/ws/system-audio/{session_id}")
async def system_audio_stream_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for system audio stream.
    
    Receives system audio (desktop sound) from the client and processes it.
    This stream handles audio output from the user's computer (speakers/system sounds).
    
    Args:
        websocket: WebSocket connection
        session_id: Unique session identifier for this recording session
        
    Protocol:
        Client sends:
        - Binary data: Audio chunks in WebM format
        - JSON control messages: {"type": "control", "action": "pause|resume|stop"}
        
        Server sends:
        - JSON status updates: {"type": "status", "message": "...", "received_bytes": int}
        - JSON errors: {"type": "error", "message": "..."}
    """
    await websocket.accept()
    logger.info(f"System audio stream connected for session {session_id}")
    
    # Initialize or update session tracking
    if session_id not in active_sessions:
        active_sessions[session_id] = {
            "video": {"connected": False, "bytes_received": 0, "chunks": 0},
            "system_audio": {"connected": True, "bytes_received": 0, "chunks": 0},
            "microphone": {"connected": False, "bytes_received": 0, "chunks": 0},
            "start_time": datetime.now().isoformat()
        }
    else:
        active_sessions[session_id]["system_audio"]["connected"] = True
    
    total_bytes = 0
    chunk_count = 0
    
    try:
        while True:
            message = await websocket.receive()
            
            if "bytes" in message:
                # Binary audio data
                audio_chunk = message["bytes"]
                chunk_size = len(audio_chunk)
                total_bytes += chunk_size
                chunk_count += 1
                
                # Update session stats
                active_sessions[session_id]["system_audio"]["bytes_received"] = total_bytes
                active_sessions[session_id]["system_audio"]["chunks"] = chunk_count
                
                # TODO: Process system audio chunk (e.g., save, transcribe, analyze)
                if chunk_count % 10 == 0:
                    logger.debug(f"Session {session_id} - System Audio: {chunk_count} chunks, {total_bytes} bytes")
                    await websocket.send_json({
                        "type": "status",
                        "message": "System audio chunk received",
                        "received_bytes": total_bytes,
                        "chunk_count": chunk_count
                    })
                    
            elif "text" in message:
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")
                    
                    if msg_type == "control":
                        action = data.get("action")
                        logger.info(f"System audio control: {action} for session {session_id}")
                        await websocket.send_json({
                            "type": "control_ack",
                            "action": action,
                            "status": "ok"
                        })
                    elif msg_type == "end":
                        logger.info(f"System audio stream end for session {session_id}")
                        break
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON"
                    })
                    
    except WebSocketDisconnect:
        logger.info(f"System audio disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"System audio error for session {session_id}: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        if session_id in active_sessions:
            active_sessions[session_id]["system_audio"]["connected"] = False
        await websocket.close()
        logger.info(f"System audio closed for session {session_id}. Total: {total_bytes} bytes, {chunk_count} chunks")


@router.websocket("/ws/microphone/{session_id}")
async def microphone_stream_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for microphone audio stream.
    
    Receives microphone audio from the client and processes it.
    This stream handles audio input from the user's microphone.
    
    Args:
        websocket: WebSocket connection
        session_id: Unique session identifier for this recording session
        
    Protocol:
        Client sends:
        - Binary data: Audio chunks in WebM format
        - JSON control messages: {"type": "control", "action": "pause|resume|stop"}
        
        Server sends:
        - JSON status updates: {"type": "status", "message": "...", "received_bytes": int}
        - JSON transcripts (if ASR enabled): {"type": "transcript", "text": "..."}
        - JSON errors: {"type": "error", "message": "..."}
    """
    await websocket.accept()
    logger.info(f"Microphone stream connected for session {session_id}")
    
    # Initialize or update session tracking
    if session_id not in active_sessions:
        active_sessions[session_id] = {
            "video": {"connected": False, "bytes_received": 0, "chunks": 0},
            "system_audio": {"connected": False, "bytes_received": 0, "chunks": 0},
            "microphone": {"connected": True, "bytes_received": 0, "chunks": 0},
            "start_time": datetime.now().isoformat()
        }
    else:
        active_sessions[session_id]["microphone"]["connected"] = True
    
    total_bytes = 0
    chunk_count = 0
    
    try:
        while True:
            message = await websocket.receive()
            
            if "bytes" in message:
                # Binary audio data
                audio_chunk = message["bytes"]
                chunk_size = len(audio_chunk)
                total_bytes += chunk_size
                chunk_count += 1
                
                # Update session stats
                active_sessions[session_id]["microphone"]["bytes_received"] = total_bytes
                active_sessions[session_id]["microphone"]["chunks"] = chunk_count
                
                # TODO: Process microphone audio (e.g., transcribe with ASR, save, analyze)
                # TODO: Integrate with ASR service (Whisper, Google Speech-to-Text, etc.)
                if chunk_count % 10 == 0:
                    logger.debug(f"Session {session_id} - Microphone: {chunk_count} chunks, {total_bytes} bytes")
                    await websocket.send_json({
                        "type": "status",
                        "message": "Microphone chunk received",
                        "received_bytes": total_bytes,
                        "chunk_count": chunk_count
                    })
                    
            elif "text" in message:
                try:
                    data = json.loads(message["text"])
                    msg_type = data.get("type")
                    
                    if msg_type == "control":
                        action = data.get("action")
                        logger.info(f"Microphone control: {action} for session {session_id}")
                        await websocket.send_json({
                            "type": "control_ack",
                            "action": action,
                            "status": "ok"
                        })
                    elif msg_type == "end":
                        logger.info(f"Microphone stream end for session {session_id}")
                        break
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Invalid JSON"
                    })
                    
    except WebSocketDisconnect:
        logger.info(f"Microphone disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"Microphone error for session {session_id}: {e}")
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except:
            pass
    finally:
        if session_id in active_sessions:
            active_sessions[session_id]["microphone"]["connected"] = False
        await websocket.close()
        logger.info(f"Microphone closed for session {session_id}. Total: {total_bytes} bytes, {chunk_count} chunks")


@router.get("/session/{session_id}/status")
async def get_session_status(session_id: str, _: None = Depends(verify_internal_api_key)):
    """
    Get the current status of a streaming session.
    
    Returns information about all three streams (video, system audio, microphone)
    including connection status and data received.
    
    Args:
        session_id: The session ID to query
        
    Returns:
        dict: Session status including connection info and statistics
        
    Raises:
        HTTPException: If session not found
    """
    if session_id not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    
    return {
        "status": "success",
        "data": {
            "session_id": session_id,
            "session_info": active_sessions[session_id]
        }
    }


@router.delete("/session/{session_id}")
async def terminate_session(session_id: str, _: None = Depends(verify_internal_api_key)):
    """
    Terminate a streaming session and clean up resources.
    
    Args:
        session_id: The session ID to terminate
        
    Returns:
        dict: Success message
        
    Raises:
        HTTPException: If session not found
    """
    if session_id not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session {session_id} not found"
        )
    
    # Remove session from active sessions
    del active_sessions[session_id]
    logger.info(f"Session {session_id} terminated and cleaned up")
    
    return {
        "status": "success",
        "message": f"Session {session_id} terminated"
    }
