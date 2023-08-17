"""
course_catalog tasks
"""
import logging

from learning_resources.etl import pipelines

from open_discussions.celery import app


log = logging.getLogger(__name__)


@app.task
def get_xpro_data():
    """Execute the xPro ETL pipeline"""
    pipelines.xpro_courses_etl()
    pipelines.xpro_programs_etl()
