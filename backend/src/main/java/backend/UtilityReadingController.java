package backend;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/utility-readings")
@CrossOrigin(origins = "http://localhost:3000")
public class UtilityReadingController {

    private final UtilityReadingRepository readingRepository;
    private final UnitRepository unitRepository;

    public UtilityReadingController(
            UtilityReadingRepository readingRepository,
            UnitRepository unitRepository
    ) {
        this.readingRepository = readingRepository;
        this.unitRepository = unitRepository;
    }

    @GetMapping
    public List<UtilityReading> getReadings() {
        return readingRepository.findAll();
    }

    @GetMapping("/unit/{unitId}")
    public List<UtilityReading> getReadingsByUnit(
            @PathVariable Long unitId
    ) {
        return readingRepository.findByUnitId(unitId);
    }

    @PostMapping
    public UtilityReading createReading(
            @RequestBody UtilityReadingRequest request
    ) {
        Unit unit = unitRepository.findById(request.unitId())
                .orElseThrow(() ->
                        new RuntimeException("호실을 찾을 수 없습니다.")
                );

        if (request.currentReading()
                .compareTo(request.previousReading()) < 0) {
            throw new RuntimeException(
                    "현재 검침값은 이전 검침값보다 작을 수 없습니다."
            );
        }

        BigDecimal usageAmount =
                request.currentReading()
                        .subtract(request.previousReading());

        BigDecimal chargeAmount =
                usageAmount.multiply(request.unitPrice());

        UtilityReading reading = new UtilityReading();

        reading.setUnit(unit);
        reading.setUtilityType(request.utilityType());
        reading.setReadingDate(request.readingDate());
        reading.setPreviousReading(request.previousReading());
        reading.setCurrentReading(request.currentReading());
        reading.setUsageAmount(usageAmount);
        reading.setUnitPrice(request.unitPrice());
        reading.setChargeAmount(chargeAmount);

        return readingRepository.save(reading);
    }

    @PutMapping("/{id}")
    public UtilityReading updateReading(
            @PathVariable Long id,
            @RequestBody UtilityReadingRequest request
    ) {
        UtilityReading reading = readingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utility reading not found."));
        Unit unit = unitRepository.findById(request.unitId())
                .orElseThrow(() -> new RuntimeException("Unit not found."));
        if (request.currentReading().compareTo(request.previousReading()) < 0) {
            throw new RuntimeException("Current reading cannot be less than previous reading.");
        }
        BigDecimal usageAmount = request.currentReading().subtract(request.previousReading());
        reading.setUnit(unit);
        reading.setUtilityType(request.utilityType());
        reading.setReadingDate(request.readingDate());
        reading.setPreviousReading(request.previousReading());
        reading.setCurrentReading(request.currentReading());
        reading.setUsageAmount(usageAmount);
        reading.setUnitPrice(request.unitPrice());
        reading.setChargeAmount(usageAmount.multiply(request.unitPrice()));
        return readingRepository.save(reading);
    }

    @DeleteMapping("/{id}")
    public void deleteReading(@PathVariable Long id) {
        UtilityReading reading = readingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utility reading not found."));
        readingRepository.delete(reading);
    }

    public record UtilityReadingRequest(
            Long unitId,
            String utilityType,
            LocalDate readingDate,
            BigDecimal previousReading,
            BigDecimal currentReading,
            BigDecimal unitPrice
    ) {
    }
}
