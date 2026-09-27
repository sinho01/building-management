package backend;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "electric_meters", uniqueConstraints = @UniqueConstraint(
        name = "uk_electric_meter_position_name", columnNames = { "meter_position", "meter_name" }))
public class ElectricMeter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "meter_position", nullable = false)
    private String meterPosition;

    @Column(name = "meter_name", nullable = false)
    private String meterName;

    @Column(name = "meter_type", nullable = false)
    private String meterType;

    @Column(name = "meter_model")
    private String meterModel;

    @CreationTimestamp
    @Column(nullable = false, updatable = false, columnDefinition = "timestamp default current_timestamp")
    private LocalDateTime createdAt;

    public Long getId() { return id; }
    public String getMeterPosition() { return meterPosition; }
    public void setMeterPosition(String meterPosition) { this.meterPosition = meterPosition; }
    public String getMeterName() { return meterName; }
    public void setMeterName(String meterName) { this.meterName = meterName; }
    public String getMeterType() { return meterType; }
    public void setMeterType(String meterType) { this.meterType = meterType; }
    public String getMeterModel() { return meterModel; }
    public void setMeterModel(String meterModel) { this.meterModel = meterModel; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
