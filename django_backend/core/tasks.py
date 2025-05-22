from celery import shared_task

@shared_task
def fetch_latest_tles():
    # Pull TLEs from Celestrak or Space-Track
    # Parse and store them in your Satellite model
    ...