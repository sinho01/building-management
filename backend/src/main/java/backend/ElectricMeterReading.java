package backend;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "electric_meter_readings")
public class ElectricMeterReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate readingDate;

    @Column(length = 7)
    private String billingMonth;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "meter_id")
    private ElectricMeter meter;

    @Column(precision = 14, scale = 3)
    private BigDecimal previousReading;

    @Column(precision = 14, scale = 3)
    private BigDecimal currentReading;

    @Column(precision = 14, scale = 3)
    private BigDecimal usageAmount;

    @Column(length = 1000)
    private String note;

    @CreationTimestamp
    @Column(nullable = false, updatable = false, columnDefinition = "timestamp default current_timestamp")
    private LocalDateTime createdAt;

    @PrePersist
    void setCreatedAtIfMissing() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public LocalDate getReadingDate() { return readingDate; }
    public void setReadingDate(LocalDate readingDate) { this.readingDate = readingDate; }
    public String getBillingMonth() { return billingMonth; }
    public void setBillingMonth(String billingMonth) { this.billingMonth = billingMonth; }
    public ElectricMeter getMeter() { return meter; }
    public void setMeter(ElectricMeter meter) { this.meter = meter; }
    public BigDecimal getPreviousReading() { return previousReading; }
    public void setPreviousReading(BigDecimal previousReading) { this.previousReading = previousReading; }
    public BigDecimal getCurrentReading() { return currentReading; }
    public void setCurrentReading(BigDecimal currentReading) { this.currentReading = currentReading; }
    public BigDecimal getUsageAmount() { return usageAmount; }
    public void setUsageAmount(BigDecimal usageAmount) { this.usageAmount = usageAmount; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
