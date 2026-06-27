import uuid as uuid_lib
from datetime import datetime

from pydantic import BaseModel

from app.domains.system.models.system_attachment import SystemAttachment


class SystemAttachmentResponse(BaseModel):
    uuid: uuid_lib.UUID
    model_uuid: uuid_lib.UUID
    record_uuid: uuid_lib.UUID
    original_name: str
    content_type: str
    size_bytes: int
    checksum_sha256: str
    created_at: datetime
    content_url: str

    @classmethod
    def from_attachment(
        cls,
        attachment: SystemAttachment,
        model_uuid: uuid_lib.UUID,
    ) -> "SystemAttachmentResponse":
        return cls(
            uuid=attachment.uuid,
            model_uuid=model_uuid,
            record_uuid=attachment.record_uuid,
            original_name=attachment.original_name,
            content_type=attachment.content_type,
            size_bytes=attachment.size_bytes,
            checksum_sha256=attachment.checksum_sha256,
            created_at=attachment.created_at,
            content_url=f"/api/system/attachments/{attachment.uuid}/content",
        )
