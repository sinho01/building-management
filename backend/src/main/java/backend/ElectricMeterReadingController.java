package backend;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/electric-meter-readings")
@CrossOrigin(origins = "http://localhost:3000")
public class ElectricMeterReadingController {

    private final ElectricMeterReadingRepository readingRepository;
    private final ElectricMeterRepository meterRepository;

    public ElectricMeterReadingController(ElectricMeterReadingRepository readingRepository,
            ElectricMeterRepository meterRepository) {
        this.readingRepository = readingRepository;
        this.meterRepository = meterRepository;
    }

    @GetMapping
    public List<ElectricMeterReading> getReadings() {
        return readingRepository.findAll();
    }

    @GetMapping("/month/{billingMonth}")
    public List<ElectricMeterReading> getReadingsByMonth(@PathVariable String billingMonth) {
        validateMonth(billingMonth);
        return readingRepository.findByBillingMonthOrderByMeter_MeterPositionAsc(billingMonth);
    }

    @PostMapping
    public ElectricMeterReading createReading(@RequestBody ReadingRequest request) {
        return readingRepository.save(apply(new ElectricMeterReading(), request));
    }

    @PutMapping("/{id}")
    public ElectricMeterReading updateReading(@PathVariable Long id, @RequestBody ReadingRequest request) {
        ElectricMeterReading reading = readingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "검침 자료를 찾을 수 없습니다."));
        return readingRepository.save(apply(reading, request));
    }

    @PostMapping("/bulk")
    @Transactional
    public List<ElectricMeterReading> saveReadings(@RequestBody BulkReadingRequest request) {
        if (request == null || request.readingDate() == null || request.billingMonth() == null
                || request.readings() == null || request.readings().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검침일, 년월과 검침 자료를 입력해 주세요.");
        }
        validateMonth(request.billingMonth());
        Set<Long> meterIds = new HashSet<>();
        List<ElectricMeterReading> readings = new ArrayList<>();
        for (ReadingLine line : request.readings()) {
            if (line.meterId() == null || !meterIds.add(line.meterId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "각 계량기는 한 달에 한 건씩만 입력할 수 있습니다.");
            }
            ElectricMeter meter = meterRepository.findById(line.meterId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "계량기 위치정보를 찾을 수 없습니다."));
            ElectricMeterReading reading = line.id() == null ? new ElectricMeterReading()
                    : readingRepository.findById(line.id()).orElseThrow(
                            () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "수정할 검침 자료를 찾을 수 없습니다."));
            validateUnique(meter.getId(), request.billingMonth(), reading.getId());
            readings.add(apply(reading, meter, request.billingMonth(), request.readingDate(),
                    line.previousReading(), line.currentReading(), line.note()));
        }
        return readingRepository.saveAll(readings);
    }

    @DeleteMapping("/{id}")
    public void deleteReading(@PathVariable Long id) {
        if (!readingRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "검침 자료를 찾을 수 없습니다.");
        }
        readingRepository.deleteById(id);
    }

    private ElectricMeterReading apply(ElectricMeterReading reading, ReadingRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검침 자료를 입력해 주세요.");
        }
        validateMonth(request.billingMonth());
        if (request.readingDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검침일을 입력해 주세요.");
        }
        if (request.meterId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "계량기를 선택해 주세요.");
        }
        ElectricMeter meter = meterRepository.findById(request.meterId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "계량기 위치정보를 찾을 수 없습니다."));
        validateUnique(meter.getId(), request.billingMonth(), reading.getId());
        return apply(reading, meter, request.billingMonth(), request.readingDate(),
                request.previousReading(), request.currentReading(), request.note());
    }

    private ElectricMeterReading apply(ElectricMeterReading reading, ElectricMeter meter, String month,
            LocalDate readingDate, BigDecimal previous, BigDecimal current, String note) {
        if (previous == null || current == null || previous.signum() < 0
                || current.compareTo(previous) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "금월 검침값은 0 이상이며 전월 검침값보다 작을 수 없습니다.");
        }
        reading.setMeter(meter);
        reading.setBillingMonth(month);
        reading.setReadingDate(readingDate);
        reading.setPreviousReading(previous);
        reading.setCurrentReading(current);
        reading.setUsageAmount(current.subtract(previous));
        reading.setNote(note);
        return reading;
    }

    private void validateUnique(Long meterId, String month, Long currentReadingId) {
        boolean duplicate = readingRepository.findByMeterIdAndBillingMonth(meterId, month).stream()
                .anyMatch(existing -> !existing.getId().equals(currentReadingId));
        if (duplicate) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이 계량기의 해당 월 검침 자료가 이미 있습니다.");
        }
    }

    private void validateMonth(String month) {
        if (month == null || !month.matches("\\d{4}-(0[1-9]|1[0-2])")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "검침 년월은 YYYY-MM 형식으로 입력해 주세요.");
        }
    }

    public record ReadingRequest(Long meterId, String billingMonth, LocalDate readingDate,
            BigDecimal previousReading, BigDecimal currentReading, String note) { }
    public record ReadingLine(Long id, Long meterId, BigDecimal previousReading,
            BigDecimal currentReading, String note) { }
    public record BulkReadingRequest(String billingMonth, LocalDate readingDate, List<ReadingLine> readings) { }
}
