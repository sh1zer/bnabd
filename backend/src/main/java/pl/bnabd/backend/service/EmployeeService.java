package pl.bnabd.backend.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.bnabd.backend.dto.EmployeeDto;
import pl.bnabd.backend.dto.EmployeeRequest;
import pl.bnabd.backend.exception.ForbiddenException;
import pl.bnabd.backend.exception.NotFoundException;
import pl.bnabd.backend.model.AppUser;
import pl.bnabd.backend.model.Employee;
import pl.bnabd.backend.model.Shelter;
import pl.bnabd.backend.model.UserRole;
import pl.bnabd.backend.repository.EmployeeRepository;
import pl.bnabd.backend.repository.ShelterRepository;

@Service
@Transactional(readOnly = true)
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final ShelterRepository shelterRepository;

    public EmployeeService(EmployeeRepository employeeRepository, ShelterRepository shelterRepository) {
        this.employeeRepository = employeeRepository;
        this.shelterRepository = shelterRepository;
    }

    public List<EmployeeDto> findAll() {
        return employeeRepository.findAll().stream().map(this::toDto).toList();
    }

    public List<EmployeeDto> findByShelter(long shelterId) {
        getShelter(shelterId);
        return employeeRepository.findByShelterId(shelterId).stream().map(this::toDto).toList();
    }

    @Transactional
    public EmployeeDto add(long shelterId, EmployeeRequest request, AppUser currentUser) {
        Shelter shelter = getShelter(shelterId);
        assertCanManage(shelter, currentUser);
        Employee employee = new Employee();
        employee.setShelter(shelter);
        apply(employee, request);
        return toDto(employeeRepository.save(employee));
    }

    @Transactional
    public void delete(long shelterId, long employeeId, AppUser currentUser) {
        Shelter shelter = getShelter(shelterId);
        assertCanManage(shelter, currentUser);
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono pracownika o id " + employeeId + "."));
        if (!employee.getShelter().getId().equals(shelterId)) {
            throw new NotFoundException("Pracownik nie należy do tego schroniska.");
        }
        employeeRepository.delete(employee);
    }

    private Shelter getShelter(long shelterId) {
        return shelterRepository.findById(shelterId)
                .orElseThrow(() -> new NotFoundException("Nie znaleziono schroniska o id " + shelterId + "."));
    }

    private void assertCanManage(Shelter shelter, AppUser user) {
        if (user.getRole() == UserRole.ADMIN) return;
        if (shelter.getOwner() == null || !shelter.getOwner().getId().equals(user.getId())) {
            throw new ForbiddenException("Nie zarządzasz tym schroniskiem.");
        }
    }

    private void apply(Employee e, EmployeeRequest r) {
        e.setFirstName(r.firstName());
        e.setLastName(r.lastName());
        e.setPosition(r.position());
        e.setPhone(r.phone());
    }

    private EmployeeDto toDto(Employee e) {
        return new EmployeeDto(
                e.getId(),
                e.getShelter().getId(),
                e.getShelter().getName(),
                e.getFirstName(),
                e.getLastName(),
                e.getPosition(),
                e.getPhone());
    }
}
