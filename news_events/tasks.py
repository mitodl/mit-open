"""Tasks for news_events"""

from main.celery import app
from news_events.etl import pipelines


@app.task
def get_medium_mit_news():
    """Run the Medium MIT News ETL pipeline"""
    pipelines.medium_mit_news_etl()


@app.task
def get_ol_events():
    """Run the Open Learning Events ETL pipeline"""
    pipelines.ol_events_etl()


@app.task
def get_sloan_exec_news():
    """Run the Sloan executive education news ETL pipeline"""
    pipelines.sloan_exec_news_etl()


@app.task
def get_sloan_exec_webinars():
    """Run the Sloan webinars ETL pipeline"""
    pipelines.sloan_webinars_etl()


@app.task
def get_mitpe_news():
    """Run the MIT Professional Education news ETL pipeline"""
    pipelines.mitpe_news_etl()


@app.task
def get_mitpe_events():
    """Run the MIT Professional Education events ETL pipeline"""
    pipelines.mitpe_events_etl()
