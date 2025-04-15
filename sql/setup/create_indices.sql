-- ORDER: 3

/**
 * Add indices to tables
 * Use b-tree as default unless you're certain another option is more efficient and won't cause issues
 */

-- Indices for foreign keys
CREATE INDEX idx_course_user_id_fk ON public.course USING btree(user_id);

CREATE INDEX idx_quiz_question_course_id_fk ON public.quiz_question USING btree(course_id);

-- enrolled_course's two foreign keys are its primary key, so they already have an index

CREATE INDEX idx_course_attempt_user_id_fk ON public.course_attempt USING btree(user_id);
CREATE INDEX idx_course_attempt_course_id_fk ON public.course_attempt USING btree(course_id);

CREATE INDEX idx_quiz_attempt_course_id_fk ON public.quiz_attempt USING btree(course_id);
CREATE INDEX idx_quiz_attempt_user_id_fk ON public.quiz_attempt USING btree(user_id);
CREATE INDEX idx_quiz_attempt_course_attempt_id_fk ON public.quiz_attempt USING btree(course_attempt_id);

CREATE INDEX idx_quiz_question_attempt_course_id_fk ON public.quiz_question_attempt USING btree(course_id);
CREATE INDEX idx_quiz_question_attempt_user_id_fk ON public.quiz_question_attempt USING btree(user_id);
CREATE INDEX idx_quiz_question_attempt_quiz_question_id_fk ON public.quiz_question_attempt USING btree(quiz_question_id);
CREATE INDEX idx_quiz_question_attempt_course_attempt_id_fk ON public.quiz_question_attempt USING btree(course_attempt_id);
CREATE INDEX idx_quiz_question_attempt_quiz_attempt_id_fk ON public.quiz_question_attempt USING btree(quiz_attempt_id);

CREATE INDEX idx_notification_user_id_fk ON public.notification USING btree(user_id);

CREATE INDEX idx_error_log_user_id_fk ON public.error_log USING btree(request_user_id);

-- Frequently called endpoints
-- Note: get-notifications is excluded as it's querying a foreign key (already indexed)

-- get-courses (enrolled course's user_id is the first part of the primary key index, so already implicitly indexed)
CREATE INDEX idx_course_active
    ON public.course USING btree(active)
    WHERE active IS TRUE;

-- get-course-data (enrolled course already has index as primary key)
CREATE INDEX idx_course_id_active
    ON public.course USING btree(id, active)
    WHERE active IS TRUE;

CREATE INDEX idx_course_attempt_user_id_course_id ON public.course_attempt USING btree(user_id, course_id);

-- get-profile query for completed courses
CREATE INDEX idx_course_attempt_user_id_pass
    ON public.course_attempt USING btree(user_id, pass)
    WHERE pass IS TRUE;

-- get-admin-insights
CREATE INDEX idx_quiz_attempt_pass_end_time
    ON public.quiz_attempt USING btree(pass, end_time)
    WHERE pass IS NULL AND end_time IS NOT NULL;
