package pl.bnabd.backend.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import pl.bnabd.backend.dto.EmployeeDto;
import pl.bnabd.backend.dto.EmployeeRequest;
import pl.bnabd.backend.service.CurrentUserProvider;
import pl.bnabd.backend.service.EmployeeService;

@RestController
@RequestMapping("/api/shelters/{shelterId}/employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final CurrentUserProvider currentUserProvider;

    public EmployeeController(EmployeeService employeeService, CurrentUserProvider currentUserProvider) {
        this.employeeService = employeeService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping
    public List<EmployeeDto> list(@PathVariable long shelterId) {
        return employeeService.findByShelter(shelterId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public EmployeeDto add(@PathVariable long shelterId, @Valid @RequestBody EmployeeRequest request) {
        return employeeService.add(shelterId, request, currentUserProvider.require());
    }

    @DeleteMapping("/{employeeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long shelterId, @PathVariable long employeeId) {
        employeeService.delete(shelterId, employeeId, currentUserProvider.require());
    }
}
