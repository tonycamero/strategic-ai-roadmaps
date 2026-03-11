# Excel Schedule Ingestion Specification
Location: system/sar-shield/excel_schedule_ingestion_spec.md

Purpose

This document defines how SAR Shield ingests operational schedules from Excel spreadsheets.

Many organizations manage production schedules using spreadsheets. SAR Shield must be able to convert these spreadsheets into structured operational events.


Typical Spreadsheet Sources

brew schedules
production calendars
maintenance schedules
shift planning sheets
inventory reorder schedules


Example Spreadsheet Columns

date
production_batch
recipe
tank
operator
expected_duration
status


Ingestion Pipeline

Excel File
↓
File Upload or Watch Folder
↓
Excel Parser
↓
Row Mapping
↓
Event Normalization
↓
Operational Event Store


File Detection

Excel files may be detected through:

manual upload
scheduled ingestion job
file watch directory
cloud storage trigger


Parsing

The ingestion service reads spreadsheet rows and converts them to structured records.


Example Raw Row

date: 2026-03-10
batch: IPA_442
tank: TANK_12
recipe: IPA
status: scheduled


Row Mapping

Each row is mapped to a normalized event.

Example:

schedule.created
schedule.updated
production.batch.scheduled


Example Event Output

{
  "event_type": "production.batch.scheduled",
  "entity_type": "production_batch",
  "entity_id": "IPA_442",
  "timestamp": "2026-03-10T08:00:00Z",
  "payload": {
    "tank": "TANK_12",
    "recipe": "IPA",
    "status": "scheduled"
  }
}


Duplicate Detection

Duplicate rows are detected using:

batch id
schedule date
tank


Error Handling

If a row cannot be normalized:

the row is skipped
the error is logged
the import continues


Metadata

Events generated from spreadsheets include metadata:

source_file
import_batch_id
row_number


Relationship to SAR Shield

Excel ingestion acts as an adapter feeding structured events into the event layer.