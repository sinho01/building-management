package backend;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/electric-meters")
@CrossOrigin(origins = "http://localhost:3000")
public class ElectricMeterController {

    private final ElectricMeterRepository repository;

    public ElectricMeterController(ElectricMeterRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ElectricMeter> getMeters() {
        return repository.findAllByOrderByMeterPositionAscMeterNameAsc();
    }
}
