"""Functions to combine duplicate courses"""

from learning_resources.constants import RunAvailability


def get_most_relevant_run(runs):
    """
    Helper function to determine the most relevant course run.

    Args:
        runs (QuerySet): a set of LearningResourseRun objects
    Returns:
        A LearningResourseRun object
    """  # noqa: D401

    # if there is a current run in the set pick it
    most_relevant_run = next(
        (run for run in runs if run.availability == RunAvailability.current.value),
        None,
    )

    if not most_relevant_run:
        # if there a future runs in the set, pick the one with earliest start date
        runs = runs.order_by("start_date")
        most_relevant_run = next(
            (
                run
                for run in runs
                if run.availability
                in [
                    RunAvailability.upcoming.value,
                    RunAvailability.starting_soon.value,
                ]
            ),
            None,
        )

        if not most_relevant_run:
            # get latest past run by start date
            most_relevant_run = next(run for run in runs.reverse())

    return most_relevant_run
