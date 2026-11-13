const bookingService = require('../services/booking.service');

class BookingController {
  bookOffer(req, res, next) {
    try {
      const { offerId } = req.params;
      const booking = bookingService.bookOffer(offerId);
      res.status(201).json({
        success: true,
        message: 'Offer successfully booked and confirmed',
        data: booking,
      });
    } catch (err) {
      res.status(err.statusCode || 400).json({
        success: false,
        error: err.message,
      });
    }
  }

  getBooking(req, res, next) {
    try {
      const { bookingNumber } = req.params;
      const booking = bookingService.getBookingByNumber(bookingNumber);
      if (!booking) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'BOOKING_NOT_FOUND',
            message: 'Booking not found.',
          },
        });
      }

      res.json({
        success: true,
        data: booking,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BookingController();

