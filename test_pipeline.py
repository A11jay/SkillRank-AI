import unittest
from unittest.mock import MagicMock, patch
from scorer import calculate_score
import json

class TestResumeScreening(unittest.TestCase):
    
    def setUp(self):
        self.mock_jd_data = {
            "Python": {"priority": "Must-Have", "weight": 3},
            "Product Management": {"priority": "Must-Have", "weight": 3},
            "SQL": {"priority": "Nice-to-Have", "weight": 1}
        }
    
    def test_scoring_logic_resume_1(self):
        # Resume 1: Python (4), SQL (2)
        resume_skills = {"Python": 4, "SQL": 2}
        score, missing = calculate_score(self.mock_jd_data, resume_skills)
        
        # Expected: (4 * 3) + (2 * 1) = 12 + 2 = 14
        self.assertEqual(score, 14)
        # Missing: Product Management (Must-Have)
        self.assertIn("Product Management", missing)
        print(f"Resume 1 Score: {score}, Missing: {missing}")

    def test_scoring_logic_resume_2(self):
        # Resume 2: Python (1), SQL (5)
        resume_skills = {"Python": 1, "SQL": 5}
        score, missing = calculate_score(self.mock_jd_data, resume_skills)
        
        # Expected: (1 * 3) + (5 * 1) = 3 + 5 = 8
        self.assertEqual(score, 8)
        self.assertIn("Product Management", missing)
        print(f"Resume 2 Score: {score}, Missing: {missing}")

    @patch('jd_parser.genai')
    def test_jd_parser_structure(self, mock_genai):
        # Verification that function returns expected structure given a mock response
        from jd_parser import parse_jd
        
        mock_model = MagicMock()
        mock_genai.GenerativeModel.return_value = mock_model
        
        mock_response = MagicMock()
        mock_response.text = json.dumps(self.mock_jd_data)
        mock_model.generate_content.return_value = mock_response
        
        result = parse_jd("dummy text", "dummy_key")
        self.assertEqual(result, self.mock_jd_data)

if __name__ == '__main__':
    unittest.main()
