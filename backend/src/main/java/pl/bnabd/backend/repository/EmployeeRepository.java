package pl.bnabd.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pl.bnabd.backend.model.Employee;
import java.util.List;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByShelterId(Long shelterId);
    void deleteByShelterId(Long shelterId);
}
