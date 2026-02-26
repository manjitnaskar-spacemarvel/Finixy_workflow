# Backend Report Integration Checklist

## Current Status

- ✅ Frontend updated to fetch report data using `report_id`
- ✅ Frontend displays beautiful dashboards for different report types
- ⚠️ Backend needs to ensure S3 data is being returned properly

## Backend Requirements

### 1. Environment Variables (Already Set)

```env
AWS_REGION=ap-south-1
S3_BUCKET_NAME=finixi-platform-bucket
DB_HOST=finixi-db.cfgegyo4afpw.ap-south-1.rds.amazonaws.com
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=spaceMarvel!300
DB_NAME=postgres
```

### 2. Backend Endpoint: `/api/v1/reports/{report_id}`

The endpoint should:

1. **Fetch report metadata from database** (`final_reports` table)
   - Get `report_id`, `report_type`, `report_title`, `generated_at`, `status`
   - Get `report_meta` which contains the S3 key

2. **Fetch report data from S3**
   - Extract S3 key from `report_meta` column (e.g., `{"json_s3_key": "reports/0r0Da1S1-2B8a9-42f4-8de2-8029..."}`)
   - Use boto3 to fetch the JSON file from S3
   - Parse the JSON data

3. **Return combined response**
   ```json
   {
     "status": "success",
     "report": {
       "report_id": "uuid",
       "report_type": "ap_aging",
       "report_title": "AP Aging Report",
       "generated_at": "2026-02-26T05:15:51.705Z",
       "status": "generated",
       "report_data": {
         // THIS IS THE JSON DATA FROM S3
         "summary": {
           "total_outstanding": 150000,
           "total_invoices": 25,
           "overdue_amount": 50000,
           "average_days": 45
         },
         "aging_buckets": [
           { "bucket": "0-30 days", "amount": 50000, "count": 10 },
           { "bucket": "31-60 days", "amount": 40000, "count": 8 },
           { "bucket": "61-90 days", "amount": 30000, "count": 5 },
           { "bucket": "90+ days", "amount": 30000, "count": 2 }
         ],
         "invoices": [
           {
             "invoice_number": "INV-001",
             "vendor_name": "Acme Corp",
             "invoice_date": "2026-01-15",
             "due_date": "2026-02-15",
             "amount": 10000,
             "outstanding": 10000,
             "days_outstanding": 42,
             "aging_bucket": "31-60 days"
           }
           // ... more invoices
         ]
       }
     }
   }
   ```

### 3. Example Backend Code (Python/FastAPI)

```python
import boto3
import json
from fastapi import HTTPException

s3_client = boto3.client('s3', region_name='ap-south-1')

@app.get("/api/v1/reports/{report_id}")
async def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get report by ID with full data from S3"""

    # 1. Fetch report metadata from database
    report = db.query(FinalReport).filter(
        FinalReport.report_id == report_id,
        FinalReport.user_id == current_user.id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # 2. Extract S3 key from report_meta
    report_meta = report.report_meta or {}
    s3_key = report_meta.get('json_s3_key')

    if not s3_key:
        raise HTTPException(status_code=404, detail="Report data not found in S3")

    # 3. Fetch data from S3
    try:
        response = s3_client.get_object(
            Bucket='finixi-platform-bucket',
            Key=s3_key
        )
        report_data = json.loads(response['Body'].read().decode('utf-8'))
    except Exception as e:
        logger.error(f"Failed to fetch report from S3: {e}")
        raise HTTPException(status_code=500, detail="Failed to load report data")

    # 4. Return combined response
    return {
        "status": "success",
        "report": {
            "report_id": report.report_id,
            "report_type": report.report_type,
            "report_title": report.report_title,
            "generated_at": report.generated_at.isoformat(),
            "status": report.status,
            "report_data": report_data  # JSON data from S3
        }
    }
```

### 4. Verify Backend Response

Test the endpoint:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/reports/a5c1d545-3064-4164-8d3d-5b5e5415c6a0
```

Expected response should include `report_data` with the actual JSON content from S3.

## Frontend Flow

1. User uploads document → Backend processes → Creates workflow
2. Backend generates report → Saves JSON to S3 → Stores S3 key in `final_reports.report_meta`
3. Backend returns `report_id` in workflow response
4. Frontend saves `report_id` to config
5. User switches to Report tab
6. Frontend calls `/api/v1/reports/{report_id}`
7. Backend fetches JSON from S3 and returns it
8. Frontend displays beautiful dashboard with the data

## Testing

1. Check browser console for:
   - "📊 Loading report data for ID: ..."
   - "✅ Report data loaded: ..."

2. Check Network tab for:
   - Request to `/api/v1/reports/{report_id}`
   - Response should contain `report_data` object

3. If you see "No Report Generated Yet":
   - Check if `config.reportId` is set (console.log in App.tsx)
   - Check if backend is returning `report_id` in workflow response

## Common Issues

1. **"Report not found"**: Backend can't find report in database
   - Verify report_id exists in `final_reports` table
   - Check user_id matches

2. **"Report data not found in S3"**: S3 key is missing or invalid
   - Check `report_meta` column has `json_s3_key`
   - Verify S3 key format

3. **"Failed to load report data"**: S3 fetch failed
   - Check AWS credentials
   - Verify S3 bucket name and region
   - Check S3 key exists in bucket

4. **Dashboard shows "No data available"**: JSON structure doesn't match expected format
   - Check S3 JSON structure
   - Verify it has `summary`, `invoices`, or `data` fields
