package backend;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class ElectricMeterDataInitializer implements CommandLineRunner {

    private final ElectricMeterRepository repository;

    public ElectricMeterDataInitializer(ElectricMeterRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {
        List<MeterSeed> initialMeters = List.of(
                new MeterSeed("옥상", "8층 계량기"),
                new MeterSeed("옥상", "7층 계량기"),
                new MeterSeed("옥상", "6층 계량기"),
                new MeterSeed("옥상", "5층 계량기"),
                new MeterSeed("옥상", "4층 계량기"),
                new MeterSeed("옥상", "3층 계량기"),
                new MeterSeed("옥상", "2층 계량기"),
                new MeterSeed("옥상", "1층 계량기"),
                new MeterSeed("옥상", "공용 전기계량기"),
                new MeterSeed("2층", "독일보청기 계량기"),
                new MeterSeed("4층", "선진회계 전기계량기"),
                new MeterSeed("5층", "음악실루틴 계량기"),
                new MeterSeed("6층", "(주)우성에이스 계량기")
        );

        for (MeterSeed seed : initialMeters) {
            if (!repository.existsByMeterPositionAndMeterName(seed.position(), seed.name())) {
                ElectricMeter meter = new ElectricMeter();
                meter.setMeterPosition(seed.position());
                meter.setMeterName(seed.name());
                meter.setMeterType("디지털");
                meter.setMeterModel(null);
                repository.save(meter);
            }
        }
    }

    private record MeterSeed(String position, String name) { }
}
