"""Tests for Professional Education ETL functions"""

import datetime
import json
from pathlib import Path

import pytest

from learning_resources.etl import mitpe
from learning_resources.factories import (
    LearningResourceOfferorFactory,
    LearningResourceTopicFactory,
    LearningResourceTopicMappingFactory,
)
from main.test_utils import assert_json_equal

EXPECTED_COURSES = [
    {
        "readable_id": "a44c8b47-552c-45f9-b91b-854172201889",
        "offered_by": {"code": "mitpe"},
        "platform": "mitpe",
        "etl_source": "mitpe",
        "professional": True,
        "certification": True,
        "certification_type": "professional",
        "title": "Comunicação Persuasiva: Pensamento Crítico para Aprimorar a Mensagem (Portuguese)",
        "url": "https://professional.mit.edu/course-catalog/comunicacao-persuasiva-pensamento-critico-para-aprimorar-mensagem-portuguese",
        "image": {
            "alt": " Persuasive Communication Critical Thinking -web banner",
            "url": "https://professional.mit.edu/sites/default/files/2022-01/1600x800.png",
        },
        "description": "Profissionais de áreas técnicas estão acostumados a falar ou apresentar dados para perfis que compartem os mesmos interesses e campo de atuação, mas podem encontrar dificuldades em transmitir suas ideias para pessoas de outros setores.\n",
        "course": {"course_numbers": []},
        "learning_format": ["online"],
        "published": True,
        "topics": [{"name": "Data Science"}],
        "runs": [
            {
                "run_id": "7802023070620230907",
                "title": "Comunicação Persuasiva: Pensamento Crítico para Aprimorar a Mensagem (Portuguese)",
                "description": "Profissionais de áreas técnicas estão acostumados a falar ou apresentar dados para perfis que compartem os mesmos interesses e campo de atuação, mas podem encontrar dificuldades em transmitir suas ideias para pessoas de outros setores.\n",
                "start_date": datetime.datetime(2023, 7, 6, 4, 0, tzinfo=datetime.UTC),
                "end_date": datetime.datetime(2023, 9, 7, 4, 0, tzinfo=datetime.UTC),
                "enrollment_end": datetime.datetime(
                    2023, 4, 25, 4, 0, tzinfo=datetime.UTC
                ),
                "published": True,
                "prices": ["1870"],
                "url": "https://professional.mit.edu/course-catalog/comunicacao-persuasiva-pensamento-critico-para-aprimorar-mensagem-portuguese",
                "instructors": [{"full_name": "Edward Schiappa"}, {"full_name": ""}],
            }
        ],
    },
    {
        "readable_id": "e3be75f6-f7c9-432b-9c24-70c7132e1583",
        "offered_by": {"code": "mitpe"},
        "platform": "mitpe",
        "etl_source": "mitpe",
        "professional": True,
        "certification": True,
        "certification_type": "professional",
        "title": "Design-Thinking and Innovation for Technical Leaders",
        "url": "https://professional.mit.edu/course-catalog/design-thinking-and-innovation-technical-leaders",
        "image": {
            "alt": "Mastering Innovation &amp;amp; Design-Thinking header ",
            "url": "https://professional.mit.edu/sites/default/files/2020-08/MITPE-MasteringInnovationDesignThinking-website-banner-1600x800.jpg",
        },
        "description": "Become a stronger leader of innovation and design-thinking in your workplace. Join us for a highly interactive and engaging course that will teach you powerful new approaches for creating innovative solutions, crafting vision that gets buy-in, and developing solutions that people love. You'll learn our proven 10-Step Design Process and gain the strategies and hands-on experience to make your mark as a leader of innovation. Don't miss this opportunity to take your leadership capabilities to the next level.\n\nThis course&nbsp;may be taken individually or as part of the&nbsp;Professional Certificate Program in Innovation and Technology.\n",
        "course": {"course_numbers": []},
        "learning_format": ["in_person"],
        "published": True,
        "topics": [{"name": "Data Science"}, {"name": "Product Innovation"}],
        "runs": [
            {
                "run_id": "4172023071720230719",
                "title": "Design-Thinking and Innovation for Technical Leaders",
                "description": "Become a stronger leader of innovation and design-thinking in your workplace. Join us for a highly interactive and engaging course that will teach you powerful new approaches for creating innovative solutions, crafting vision that gets buy-in, and developing solutions that people love. You'll learn our proven 10-Step Design Process and gain the strategies and hands-on experience to make your mark as a leader of innovation. Don't miss this opportunity to take your leadership capabilities to the next level.\n\nThis course&nbsp;may be taken individually or as part of the&nbsp;Professional Certificate Program in Innovation and Technology.\n",
                "start_date": datetime.datetime(2023, 7, 17, 4, 0, tzinfo=datetime.UTC),
                "end_date": datetime.datetime(2023, 7, 19, 4, 0, tzinfo=datetime.UTC),
                "enrollment_end": datetime.datetime(
                    2023, 6, 17, 4, 0, tzinfo=datetime.UTC
                ),
                "published": True,
                "prices": ["3600"],
                "url": "https://professional.mit.edu/course-catalog/design-thinking-and-innovation-technical-leaders",
                "instructors": [
                    {"full_name": "Blade Kotelly"},
                    {"full_name": "Reza Rahaman"},
                    {"full_name": ""},
                ],
            }
        ],
    },
]
EXPECTED_PROGRAMS = [
    {
        "readable_id": "790a82a4-8967-4b77-9342-4f6be5809abd",
        "offered_by": {"code": "mitpe"},
        "platform": "mitpe",
        "etl_source": "mitpe",
        "professional": True,
        "certification": True,
        "certification_type": "professional",
        "title": "Manufatura Inteligente: Produção na Indústria 4.0 (Portuguese)",
        "url": "https://professional.mit.edu/course-catalog/manufatura-inteligente-producao-na-industria-40-portuguese",
        "image": {
            "alt": "Smart Manufacturing Header Image",
            "url": "https://professional.mit.edu/sites/default/files/2020-08/Smart%20Manufacturing.jpg",
        },
        "description": "A fábrica do futuro já está aqui. Participe do programa online Manufatura Inteligente: Produção na Indústria 4.0 e aproveite a experiência de mais de cem anos de colaboração do MIT com vários setores. Aprenda as chaves para criar uma indústria inteligente em qualquer escala e saiba como software, sensores e sistemas são integrados para essa finalidade. Com este programa interativo, você passará da criação de modelos a sistemas de fabricação e análise avançada de dados para desenvolver estratégias que gerem uma vantagem competitiva.\n",
        "learning_format": ["online"],
        "published": True,
        "topics": [{"name": "Product Innovation"}],
        "runs": [
            {
                "run_id": "7192023070620230914",
                "title": "Manufatura Inteligente: Produção na Indústria 4.0 (Portuguese)",
                "description": "A fábrica do futuro já está aqui. Participe do programa online Manufatura Inteligente: Produção na Indústria 4.0 e aproveite a experiência de mais de cem anos de colaboração do MIT com vários setores. Aprenda as chaves para criar uma indústria inteligente em qualquer escala e saiba como software, sensores e sistemas são integrados para essa finalidade. Com este programa interativo, você passará da criação de modelos a sistemas de fabricação e análise avançada de dados para desenvolver estratégias que gerem uma vantagem competitiva.\n",
                "start_date": datetime.datetime(2023, 7, 6, 4, 0, tzinfo=datetime.UTC),
                "end_date": datetime.datetime(2023, 9, 14, 4, 0, tzinfo=datetime.UTC),
                "enrollment_end": datetime.datetime(
                    2023, 7, 6, 4, 0, tzinfo=datetime.UTC
                ),
                "published": True,
                "prices": ["1870"],
                "url": "https://professional.mit.edu/course-catalog/manufatura-inteligente-producao-na-industria-40-portuguese",
                "instructors": [{"full_name": ""}, {"full_name": "Brian Anthony"}],
            }
        ],
        "courses": [EXPECTED_COURSES[0]],
    }
]


@pytest.fixture()
def prof_ed_settings(settings):
    """Fixture to set Professional Education API URL"""
    settings.PROFESSIONAL_EDUCATION_RESOURCES_API_URL = "http://pro_edu_api.com"
    return settings


@pytest.fixture()
def mock_fetch_data(mocker):
    """Mock fetch_data function"""

    def read_json(file_path):
        with Path.open(file_path, "r") as file:
            return mocker.Mock(json=mocker.Mock(return_value=json.load(file)))

    return mocker.patch(
        "learning_resources.etl.mitpe.requests.get",
        side_effect=[
            read_json("./test_json/professional_ed/professional_ed_resources_0.json"),
            read_json("./test_json/professional_ed/professional_ed_resources_1.json"),
            read_json("./test_json/professional_ed/professional_ed_resources_2.json"),
        ],
    )


@pytest.mark.parametrize("prof_ed_api_url", ["http://pro_edd_api.com", None])
def test_extract(settings, mock_fetch_data, prof_ed_api_url):
    """Test extract function"""
    settings.PROFESSIONAL_EDUCATION_RESOURCES_API_URL = prof_ed_api_url
    expected = []
    for page in range(3):
        with Path.open(
            Path(f"./test_json/professional_ed/professional_ed_resources_{page}.json"),
            "r",
        ) as file:
            expected.extend(json.load(file))
    results = mitpe.extract()
    if prof_ed_api_url:
        assert len(results) == 3
        assert_json_equal(results, expected)
    else:
        assert len(results) == 0


@pytest.mark.django_db()
def test_transform(mocker, mock_fetch_data, prof_ed_settings):
    """Test transform function, and effectivelu most other functions"""
    offeror = LearningResourceOfferorFactory.create(code="mitpe")
    LearningResourceTopicMappingFactory.create(
        offeror=offeror,
        topic=LearningResourceTopicFactory.create(name="Product Innovation"),
        topic_name="Technology Innovation",
    )
    LearningResourceTopicMappingFactory.create(
        offeror=offeror,
        topic=LearningResourceTopicFactory.create(name="Data Science"),
        topic_name="Data Science",
    )
    extracted = mitpe.extract()
    assert len(extracted) == 3
    courses, programs = mitpe.transform(extracted)
    assert_json_equal(
        sorted(courses, key=lambda course: course["readable_id"]), EXPECTED_COURSES
    )
    assert_json_equal(programs, EXPECTED_PROGRAMS)
