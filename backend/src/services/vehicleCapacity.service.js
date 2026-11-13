/**
 * Vehicle Capacity Service (R5)
 * Checks whether a supplier's vehicle can accommodate passengers, luggage, and car type preference.
 */

function countPassengers(request) {
  const adults = Number(request.adults || 0);
  let childCount = 0;
  if (Array.isArray(request.childAges)) {
    childCount = request.childAges.length;
  } else if (Array.isArray(request.child_ages)) {
    childCount = request.child_ages.length;
  } else if (typeof request.child_ages_json === 'string') {
    try {
      const parsed = JSON.parse(request.child_ages_json);
      childCount = Array.isArray(parsed) ? parsed.length : 0;
    } catch (e) {
      childCount = 0;
    }
  }
  return adults + childCount;
}

function carFitsPassengers(car, request) {
  const passengers = countPassengers(request);
  return car.seats >= passengers;
}

function carFitsLuggage(car, request) {
  const requiredLarge = Number(request.largeBags ?? request.large_bags ?? 0);
  const requiredSmall = Number(request.smallBags ?? request.small_bags ?? 0);

  const carLarge = Number(car.large_bags ?? 0);
  const carSmall = Number(car.small_bags ?? 0);

  return carLarge >= requiredLarge && carSmall >= requiredSmall;
}

function carMatchesType(car, request) {
  const preferredType = request.carType || request.car_type;
  if (!preferredType || preferredType === '' || preferredType === 'null') {
    return true; // No preference, any vehicle type fits
  }
  return car.type && car.type.toUpperCase() === preferredType.toUpperCase();
}

function validateCarCapacity(car, request) {
  const passengers = countPassengers(request);
  const requiredLarge = Number(request.largeBags ?? request.large_bags ?? 0);
  const requiredSmall = Number(request.smallBags ?? request.small_bags ?? 0);

  if (car.seats < passengers) {
    return {
      valid: false,
      rule: 'R5',
      message: `Insufficient passenger seats: vehicle has ${car.seats} seats but request requires ${passengers} (${request.adults} adults + ${passengers - request.adults} children).`,
    };
  }

  const carLarge = Number(car.large_bags ?? 0);
  if (carLarge < requiredLarge) {
    return {
      valid: false,
      rule: 'R5',
      message: `Insufficient large luggage capacity: vehicle fits ${carLarge} large bags but request requires ${requiredLarge}.`,
    };
  }

  const carSmall = Number(car.small_bags ?? 0);
  if (carSmall < requiredSmall) {
    return {
      valid: false,
      rule: 'R5',
      message: `Insufficient small luggage capacity: vehicle fits ${carSmall} small bags but request requires ${requiredSmall}.`,
    };
  }

  if (!carMatchesType(car, request)) {
    const preferredType = request.carType || request.car_type;
    return {
      valid: false,
      rule: 'R5',
      message: `Car type mismatch: traveler requested ${preferredType} but car is ${car.type}.`,
    };
  }

  return {
    valid: true,
  };
}

module.exports = {
  countPassengers,
  carFitsPassengers,
  carFitsLuggage,
  carMatchesType,
  validateCarCapacity,
};
