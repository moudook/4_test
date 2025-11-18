"""    
Meeting Handler Module

Provides database operations for managing meeting records in MongoDB.
Handles CRUD operations for meeting entities including creation, retrieval,
update, and deletion.
"""

import datetime
import uuid
from typing import Optional, List

from pymongo import AsyncMongoClient
import os
import logging

from ..models.meeting import MeetingCreationData, Meeting, MeetingMiniData

class MeetingHandler:
    """    
    Handler class for meeting database operations.
    
    This class manages all MongoDB operations related to meetings, including
    creating new meetings, fetching meeting data, updating meeting information,
    and deleting meetings.
    
    Attributes:
        logger: Logger instance for this handler
        uri (str): MongoDB connection URI
        db_name (str): Name of the MongoDB database
        meeting_collection_name (str): Name of the meetings collection
        client (AsyncMongoClient): MongoDB async client instance
        db: Database reference
        meetings_collection: Collection reference for meetings
    
    Raises:
        ValueError: If required environment variables are not set
    """
    def __init__(self):
        # Loading Configuration
        self.logger = logging.getLogger("MeetingHandler")
        self.uri = os.getenv("MONGO_URI")
        self.db_name = os.getenv("MONGO_DB_NAME")
        self.meeting_collection_name = os.getenv("MEETING_COLLECTION_NAME", "meetings")


        # Error handling for missing configuration
        if self.uri is None or self.db_name is None:
            self.logger.error("Configration error: MONGO_URI or MONGO_DB_NAME not set.")
            raise ValueError("Environment variables MONGO_URI and MONGO_DB_NAME must be set.")

        self.logger.debug(f"MongoDB URI: {self.uri}, Database: {self.db_name}")

        # Initialize MongoDB Client
        self.client = AsyncMongoClient(self.uri)
        self.db = self.client[self.db_name]
        self.meetings_collection = self.db[self.meeting_collection_name]

        self.logger.info("MongoDB client initialized successfully.")
        self.logger.debug(f"Meeting collection: {self.meeting_collection_name}")

    async def create_meeting(self, meeting_data: MeetingCreationData) -> Optional[Meeting]:
        """        
        Create a new meeting record in the database.
        
        Generates a new meeting with a unique UUID, sets the start time to current UTC time,
        initializes an empty transcript, and sets status to "in_progress".
        
        Args:
            meeting_data (MeetingCreationData): Data object containing VC ID and other meeting info
            
        Returns:
            Optional[Meeting]: The created meeting object if successful, None otherwise
            
        Example:
            >>> handler = MeetingHandler()
            >>> new_meeting_data = MeetingCreationData(vc_id="vc_123")
            >>> meeting = await handler.create_meeting(new_meeting_data)
            >>> print(meeting.id)  # Outputs UUID
        """
        try:
            self.logger.debug(f"Creating meeting with data: {meeting_data}")

            # Generate new meeting object
            new_meeting = Meeting(
                _id=str(uuid.uuid4()), # generate UUID
                vc_id=meeting_data.vc_id,  # set VC ID
                start_time=datetime.datetime.now(datetime.timezone.utc),  # set start time (timezone-aware UTC)
                transcript=[],  # start empty
                status="in_progress"  # initial status
            )

            # Insert into MongoDB
            await self.meetings_collection.insert_one(new_meeting.model_dump(by_alias=True))
            self.logger.info(f"Meeting created with ID: {new_meeting.id} with VC ID: {new_meeting.vc_id}")
            return new_meeting

        except Exception as e:
            self.logger.error(f"Failed to create meeting: {e}", exc_info=True)
            return None

    async def get_meeting_by_id(self, meeting_id: str) -> Optional[Meeting]:
        """        
        Retrieve a meeting by its unique ID.
        
        Queries the MongoDB collection for a meeting with the specified ID and
        returns a fully populated Meeting object.
        
        Args:
            meeting_id (str): The unique identifier of the meeting
            
        Returns:
            Optional[Meeting]: The meeting object if found, None otherwise
            
        Example:
            >>> meeting = await handler.get_meeting_by_id("meeting-uuid-123")
            >>> if meeting:
            ...     print(f"Meeting with {len(meeting.transcript)} transcript chunks")
        """
        try:
            self.logger.debug(f"Fetching meeting with ID: {meeting_id}")

            # Query MongoDB
            meeting_data = await self.meetings_collection.find_one({"_id": meeting_id})

            if meeting_data:
                self.logger.info(f"Meeting found with ID: {meeting_id}")
                return Meeting.model_validate(meeting_data)
            else:
                self.logger.warning(f"No meeting found with ID: {meeting_id}")
                return None

        except Exception as e:
            self.logger.error(f"Failed to fetch meeting: {e}", exc_info=True)
            return None

    async def get_meetings_by_vc_id(self, vc_id: str) -> List[MeetingMiniData]:
        """        
        Retrieve all meetings associated with a specific VC (Venture Capitalist).
        
        Fetches minimal meeting data (ID, VC ID, timestamps, status) for all meetings
        associated with the specified VC. Useful for listing meetings without loading
        full transcript data.
        
        Args:
            vc_id (str): The VC identifier to search for
            
        Returns:
            List[MeetingMiniData]: List of minimal meeting data objects, empty list if none found
            
        Example:
            >>> meetings = await handler.get_meetings_by_vc_id("vc_123")
            >>> print(f"Found {len(meetings)} meetings for VC")
        """
        try:
            self.logger.debug(f"Fetching meetings for VC ID: {vc_id}")

            # Query MongoDB for all meetings of this VC
            meetings_cursor = self.meetings_collection.find(
                {"vc_id": vc_id},
                {"_id": 1, "vc_id": 1, "start_time": 1, "end_time": 1, "status": 1}  # only fetch minimal fields
            )

            meetings = []
            async for meeting_data in meetings_cursor:
                meetings.append(MeetingMiniData.model_validate(meeting_data))

            self.logger.info(f"Fetched {len(meetings)} meetings for VC ID: {vc_id}")
            return meetings

        except Exception as e:
            self.logger.error(f"Failed to fetch meetings for VC ID {vc_id}: {e}", exc_info=True)
            return []

    async def update_meeting(self, meeting: Meeting) -> bool:
        """        
        Update an existing meeting in the database.
        
        Replaces the entire meeting document with the provided meeting object.
        Uses the meeting's ID to locate the document to update.
        
        Args:
            meeting (Meeting): The meeting object with updated data
            
        Returns:
            bool: True if meeting was successfully updated, False otherwise
            
        Example:
            >>> meeting.status = "completed"
            >>> meeting.end_time = datetime.now(timezone.utc)
            >>> success = await handler.update_meeting(meeting)
        """
        try:
            self.logger.debug(f"Updating meeting with ID: {meeting.id}")

            # Update MongoDB
            result = await self.meetings_collection.replace_one(
                {"_id": meeting.id},
                meeting.model_dump(by_alias=True)
            )
            if result.modified_count == 1:
                self.logger.info(f"Meeting updated with ID: {meeting.id}")
                return True
            else:
                self.logger.warning(f"No meeting updated with ID: {meeting.id}")
                return False

        except Exception as e:
            self.logger.error(f"Failed to update meeting: {e}", exc_info=True)
            return False

    async def delete_meeting(self, meeting: Meeting) -> bool:
        """        
        Delete a meeting from the database.
        
        Permanently removes the meeting document from MongoDB.
        
        Args:
            meeting (Meeting): The meeting object to delete
            
        Returns:
            bool: True if meeting was successfully deleted, False otherwise
            
        Example:
            >>> success = await handler.delete_meeting(meeting)
            >>> if success:
            ...     print("Meeting deleted successfully")
        """
        try:
            self.logger.debug(f"Deleting meeting with ID: {meeting.id}")

            # Delete from MongoDB
            result = await self.meetings_collection.delete_one({"_id": meeting.id})
            if result.deleted_count == 1:
                self.logger.info(f"Meeting deleted with ID: {meeting.id}")
                return True
            else:
                self.logger.warning(f"No meeting deleted with ID: {meeting.id}")
                return False

        except Exception as e:
            self.logger.error(f"Failed to delete meeting: {e}", exc_info=True)
            return False

    async def get_all_meetings(self) -> List[MeetingMiniData]:
        """        
        Retrieve all meetings from the database.
        
        Fetches minimal data for all meetings in the collection. Useful for
        administrative views and bulk operations.
        
        Returns:
            List[MeetingMiniData]: List of all meetings with minimal data, empty list if none exist
            
        Example:
            >>> all_meetings = await handler.get_all_meetings()
            >>> print(f"Total meetings in database: {len(all_meetings)}")
        """
        try:
            self.logger.debug("Fetching all meetings base info.")

            meetings_cursor = self.meetings_collection.find({}, {"_id": 1, "vc_id": 1, "start_time": 1, "end_time": 1, "status": 1})
            meetings = []
            async for meeting_data in meetings_cursor:
                meetings.append(MeetingMiniData.model_validate(meeting_data))

            self.logger.info(f"Fetched {len(meetings)} meetings.")
            return meetings

        except Exception as e:
            self.logger.error(f"Failed to fetch meetings: {e}", exc_info=True)
            return []


