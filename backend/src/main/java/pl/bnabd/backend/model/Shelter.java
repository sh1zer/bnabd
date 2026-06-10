package pl.bnabd.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "shelters")
public class Shelter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private AppUser owner;

    @Column(nullable = false)
    private String name;

    @Column(length = 1200)
    private String description;

    @Column(nullable = false)
    private String location;

    private String phone;
    private String email;

    @Column(length = 1000)
    private String imageUrl;

    private double rating;

    private BigDecimal boardBreakfastPrice;
    private BigDecimal boardHalfBoardPrice;
    private BigDecimal boardFullBoardPrice;

    public Shelter() {
    }

    public Long getId() {
        return id;
    }

    public AppUser getOwner() {
        return owner;
    }

    public void setOwner(AppUser owner) {
        this.owner = owner;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public double getRating() {
        return rating;
    }

    public void setRating(double rating) {
        this.rating = rating;
    }

    public BigDecimal getBoardBreakfastPrice() {
        return boardBreakfastPrice;
    }

    public void setBoardBreakfastPrice(BigDecimal boardBreakfastPrice) {
        this.boardBreakfastPrice = boardBreakfastPrice;
    }

    public BigDecimal getBoardHalfBoardPrice() {
        return boardHalfBoardPrice;
    }

    public void setBoardHalfBoardPrice(BigDecimal boardHalfBoardPrice) {
        this.boardHalfBoardPrice = boardHalfBoardPrice;
    }

    public BigDecimal getBoardFullBoardPrice() {
        return boardFullBoardPrice;
    }

    public void setBoardFullBoardPrice(BigDecimal boardFullBoardPrice) {
        this.boardFullBoardPrice = boardFullBoardPrice;
    }
}
