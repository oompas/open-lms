/**
 * Generate some dummy data to populate the database
 */
DO $$
DECLARE
target_user_id UUID;
BEGIN
    -- Find the user ID for the target email
SELECT id
INTO target_user_id
FROM auth.users
WHERE email = '18rem8@queensu.ca';

-- Check if the user was found before inserting courses
IF target_user_id IS NOT NULL THEN
    -- Insert course data
    INSERT INTO public.course (
        name,
        description,
        link,
        user_id,
        min_time,
        max_quiz_attempts,
        min_quiz_score,
        preserve_quiz_question_order,
        quiz_time_limit,
        total_quiz_marks,
        num_quiz_questions
    )
    VALUES
    (
        'West Nile virus safety',
        'Learn the symptoms and treatments for the West Nile virus',
        'https://www.queensu.ca/risk/safety/general/west-nile-virus',
        target_user_id,
        NULL, -- min_time
        1,    -- max_quiz_attempts
        7,    -- min_quiz_score
        FALSE,-- preserve_quiz_question_order
        30,   -- quiz_time_limit
        10,   -- total_quiz_marks
        4     -- num_quiz_questions
    ),
    (
        'Work placement pre-departure training',
        'Learn the risks associated with off-campus work',
        'https://www.queensu.ca/risk/safety/general/student-placements',
        target_user_id,
        15,   -- min_time
        NULL, -- max_quiz_attempts
        NULL, -- min_quiz_score
        NULL, -- preserve_quiz_question_order
        NULL, -- quiz_time_limit
        NULL, -- total_quiz_marks
        NULL  -- num_quiz_questions
    ),
    (
        'Queen''s Ergonomics training',
        'Learn how to create a comfortable and efficient work environment',
        'https://www.queensu.ca/risk/safety/general/ergonomics',
        target_user_id,
        240,  -- min_time
        3,    -- max_quiz_attempts
        6,    -- min_quiz_score
        TRUE, -- preserve_quiz_question_order
        15,   -- quiz_time_limit
        8,    -- total_quiz_marks
        3     -- num_quiz_questions
    ),
    (
        'Dangerous substances',
        'Learn Ontario''s designated dangerous substances',
        'https://www.queensu.ca/risk/designated-substances',
        target_user_id,
        60,   -- min_time
        2,    -- max_quiz_attempts
        8,    -- min_quiz_score
        TRUE, -- preserve_quiz_question_order
        30,   -- quiz_time_limit
        10,   -- total_quiz_marks
        4     -- num_quiz_questions
    ),
    (
        'Queen''s asbestos safety training',
        'Understand the health risks of asbestos and effective safety measures',
        'https://www.queensu.ca/risk/safety/general/asbestos',
        target_user_id,
        20,   -- min_time
        NULL, -- max_quiz_attempts
        NULL, -- min_quiz_score
        NULL, -- preserve_quiz_question_order
        NULL, -- quiz_time_limit
        NULL, -- total_quiz_marks
        NULL  -- num_quiz_questions
    );
ELSE
        RAISE NOTICE 'User with email 18rem8@queensu.ca not found. Skipping course data insertion.';
END IF;
END $$;

-- Insert quiz question data
INSERT INTO public.quiz_question (
    course_id,
    question_order,
    question,
    marks,
    type,
    correct_answer,
    answers
)
VALUES
    (
        1,
        NULL,
        'How does West Nile Virus spread to humans?',
        2,
        'MC',
        2,
        '["Freshwater snails", "Person-To-Person", "Mosquitos", "Birds"]'
    ),
    (
        1,
        NULL,
        'In many cases, West Nile Virus causes mild or no symptoms',
        2,
        'TF',
        0,
        NULL
    ),
    (
        1,
        NULL,
        'What can be done to minimize your risk of West Nile virus?',
        3,
        'SA',
        NULL,
        NULL
    ),
    (
        1,
        NULL,
        'If you find a dead bird on campus, which of these steps should NOT be done?',
        3,
        'MC',
        2,
        '["Handle it with gloves", "Place the bird in a 6 mil bag", "Inspect under its wings for rotten flesh", "Contact Environmental Health & Safety (32999)"]'
    ),
    (
        3,
        1,
        'Ergonomic consultations are free for employees',
        3,
        'TF',
        1,
        NULL
    ),
    (
        3,
        2,
        'Workplace pains and strains are primarily known as?',
        2,
        'MC',
        1,
        '["Antiergons", "Musculoskeletal disorders", "RSIP", "Physical fidgeting"]'
    ),
    (
        3,
        3,
        'How do you get an ergonomic assessment done?',
        3,
        'MC',
        3,
        '["Request at the Queen''s Kinesiology office", "Contact Queen''s Health & Safety services", "Send an email to Doug White", "Request at the Queen''s Ergonomic Consulting Program"]'
    ),
    (
        4,
        1,
        'Dangerous substances can be biological, chemical or physical',
        1,
        'TF',
        0,
        NULL
    ),
    (
        4,
        2,
        'Which of these is NOT a designated substance?',
        3,
        'MC',
        0,
        '["Calcium chloride", "Asbestos", "Mercury", "Acrylonitrile"]'
    ),
    (
        4,
        3,
        'Assessments aren''t required if the substance is common, such as silica',
        2,
        'TF',
        1,
        NULL
    ),
    (
        4,
        4,
        'You are assigned to plan and supervise a rennovation at Queens. How do you ensure designated substances don''t harm any workers?',
        5,
        'SA',
        NULL,
        NULL
    );
