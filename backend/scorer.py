def calculate_score(jd_skills, resume_skills):
    """
    Calculates the match score between JD skills and Resume skills.
    
    Args:
        jd_skills (dict): {'Skill': {'priority': 'Must-Have', 'weight': 3}, ...}
        resume_skills (dict): {'Skill': 4, ...} (Years of Experience)
        
    Returns:
        int: Total match score.
        list: List of missing 'Must-Have' skills.
    """
    score = 0
    missing_must_haves = []
    
    for skill, details in jd_skills.items():
        weight = details.get('weight', 1)
        priority = details.get('priority', 'Nice-to-Have')
        
        if skill in resume_skills:
            years = resume_skills[skill]
            score += (years * weight)
        else:
            if priority == 'Must-Have':
                missing_must_haves.append(skill)
                
    return score, missing_must_haves
