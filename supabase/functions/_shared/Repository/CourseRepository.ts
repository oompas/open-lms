import BaseRepository from "./BaseRepository.ts";

class CourseRepository extends BaseRepository<Course> {
    protected tableName = 'courses';
    protected entityClass = Course;
}

export default CourseRepository;
