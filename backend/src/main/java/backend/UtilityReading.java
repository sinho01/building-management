package backend;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "utility_readings")
public class UtilityReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String utilityType;

    private LocalDate readingDate;

    private BigDecimal previousReading;

    private BigDecimal currentReading;

    private BigDecimal usageAmount;

    private BigDecimal unitPrice;

    private BigDecimal chargeAmount;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "unit_id", nullable = false)
    private Unit unit;

    public UtilityReading() {
    }

    public Long getId() {
        return id;
    }

    public String getUtilityType() {
        return utilityType;
    }

    public void setUtilityType(String utilityType) {
        this.utilityType = utilityType;
    }

    public LocalDate getReadingDate() {
        return readingDate;
    }

    public void setReadingDate(LocalDate readingDate) {
        this.readingDate = readingDate;
    }

    public BigDecimal getPreviousReading() {
        return previousReading;
    }

    public void setPreviousReading(BigDecimal previousReading) {
        this.previousReading = previousReading;
    }

    public BigDecimal getCurrentReading() {
        return currentReading;
    }

    public void setCurrentReading(BigDecimal currentReading) {
        this.currentReading = currentReading;
    }

    public BigDecimal getUsageAmount() {
        return usageAmount;
    }

    public void setUsageAmount(BigDecimal usageAmount) {
        this.usageAmount = usageAmount;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getChargeAmount() {
        return chargeAmount;
    }

    public void setChargeAmount(BigDecimal chargeAmount) {
        this.chargeAmount = chargeAmount;
    }

    public Unit getUnit() {
        return unit;
    }

    public void setUnit(Unit unit) {
        this.unit = unit;
    }
}