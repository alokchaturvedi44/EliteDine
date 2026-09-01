import { AuthRequest } from "../middlewares/auth.js";
import { Response } from "express";
import { Restaurant } from "../models/Restaurants.js";
import { Booking } from "../models/Booking.js";

// create a new booking
// POST /api/bookings
// @access private
export const createBooking = async (req: AuthRequest, res: Response):Promise<void> => {
    try{
        const {restaurantId, date, time, guests, occasion, specialRequests} = req.body;

        if(!restaurantId || !date || !time || !guests){
            res.status(400).json({message: "Please provide all required reservation details"});
            return;
        }

        // check if restaurant exist
        const restaurant = await Restaurant.findById(restaurantId);
        if(!restaurant){
            res.status(404).json({message: "Restaurant not found!"});
            return;
        }

        // verify if restaurant is approved
        if(restaurant.status !== "approved"){
            res.status(400).json({message: "Reservation are not open for this restaurant is not open yet"});
            return;
        }

        // verify seat availability
        const requestedGuests = Number(guests);
        const existingBookings = await Booking.find({
            restaurant: restaurantId,
            date: new Date(date),
            time,
            status: "confirmed"
        });

        const bookedSeats = existingBookings.reduce((sum, b) => sum + b.guests, 0);

        const totalSeats = restaurant.totalSeats || 20;

        const availableSeats = totalSeats - bookedSeats;

        if(requestedGuests > availableSeats){
            res.status(400).json({
                message: `Unable to reserver. Only ${availableSeats} seats are available for this time slot.`
            });
            return;
        }

        const booking = await Booking.create({
            user: req.user?._id,
            restaurant: restaurantId,
            date: new Date(date),
            time,
            guests: Number(guests),
            occasion,
            specialRequests,
            status: "confirmed"
        });

        // populate restaurant info before returning
        const populateBooking = await booking.populate("restaurant", "name location image address");

        res.status(201).json(populateBooking);
    }
    catch(error: any){
        console.error(error);
        res.status(400).json({message: error.message});
    }
}

// get logged in user booking
// POST /api/bookings/my
// @access private
export const getMyBookings = async (req: AuthRequest, res: Response):Promise<void> => {
    try{
        const bookings = await Booking.find({user: req.user?._id}).populate("restaurant", "name location image address slug").sort({date: -1, time: -1});

        res.json(bookings);
    }
    catch(error: any){
        console.error(error);
        res.status(400).json({message: error.message});
    }
}

// cancel a booking
// POST /api/bookings/:id/cancel
// @access private
export const cancelBooking = async (req: AuthRequest, res: Response):Promise<void> => {
    try{
        const booking = await Booking.findById(req.params.id);

        if(!booking){
            res.status(404).json({message: "Booking not found!"});
            return;
        }

        // verify user owns the booking
        if(booking.user.toString() !== req.user?._id.toString()){
            res.status(401).json({message: "Not authorized to cancel the booking"});
            return;
        }

        booking.status = "cancelled";
        await booking.save();

        const populatedBooking = await booking.populate("restaurant", "name location image address");
        res.json(populatedBooking);
    }
    catch(error: any){
        console.error(error);
        res.status(400).json({message: error.message});
    }
}