import { useMemo } from "react";

interface BusinessHours {
  [day: string]: {
    open: string;
    close: string;
    closed?: boolean;
  };
}

const DAY_MAP: Record<number, string> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

/**
 * Check if a restaurant is currently open based on business hours
 */
export const isRestaurantOpen = (businessHours: BusinessHours | null): boolean => {
  if (!businessHours) return true; // Default to open if no hours specified

  const now = new Date();
  const currentDay = DAY_MAP[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

  const todayHours = businessHours[currentDay];
  if (!todayHours || todayHours.closed) return false;

  const [openHour, openMin] = todayHours.open.split(":").map(Number);
  const [closeHour, closeMin] = todayHours.close.split(":").map(Number);

  const openTime = openHour * 60 + (openMin || 0);
  let closeTime = closeHour * 60 + (closeMin || 0);

  // Handle closing after midnight
  if (closeTime < openTime) {
    closeTime += 24 * 60;
    if (currentTime < openTime) {
      return currentTime + 24 * 60 < closeTime;
    }
  }

  return currentTime >= openTime && currentTime < closeTime;
};

/**
 * Get next opening time for a restaurant
 */
export const getNextOpenTime = (businessHours: BusinessHours | null): string | null => {
  if (!businessHours) return null;

  const now = new Date();
  const currentDayIndex = now.getDay();

  // Check next 7 days
  for (let i = 0; i < 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7;
    const dayName = DAY_MAP[dayIndex];
    const dayHours = businessHours[dayName];

    if (dayHours && !dayHours.closed) {
      if (i === 0) {
        // Today - check if opens later
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [openHour, openMin] = dayHours.open.split(":").map(Number);
        const openTime = openHour * 60 + (openMin || 0);

        if (currentTime < openTime) {
          return `Ouvre à ${dayHours.open}`;
        }
      } else {
        const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        return `Ouvre ${dayNames[dayIndex]} à ${dayHours.open}`;
      }
    }
  }

  return null;
};

/**
 * Hook to check restaurant availability
 */
export const useRestaurantAvailability = (businessHours: BusinessHours | null) => {
  return useMemo(() => {
    const isOpen = isRestaurantOpen(businessHours);
    const nextOpenTime = !isOpen ? getNextOpenTime(businessHours) : null;

    return {
      isOpen,
      nextOpenTime,
      status: isOpen ? "open" : "closed",
    };
  }, [businessHours]);
};

/**
 * Check if a menu item is available based on its availability settings
 * Items can have specific hours or days they're available
 */
export const isMenuItemAvailable = (
  itemAvailability?: {
    available_from?: string;
    available_until?: string;
    available_days?: string[];
  } | null
): boolean => {
  if (!itemAvailability) return true; // Default to available

  const now = new Date();
  const currentDay = DAY_MAP[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Check day availability
  if (itemAvailability.available_days?.length) {
    if (!itemAvailability.available_days.includes(currentDay)) {
      return false;
    }
  }

  // Check time availability
  if (itemAvailability.available_from && itemAvailability.available_until) {
    const [fromHour, fromMin] = itemAvailability.available_from.split(":").map(Number);
    const [untilHour, untilMin] = itemAvailability.available_until.split(":").map(Number);

    const fromTime = fromHour * 60 + (fromMin || 0);
    const untilTime = untilHour * 60 + (untilMin || 0);

    if (currentTime < fromTime || currentTime >= untilTime) {
      return false;
    }
  }

  return true;
};

export default useRestaurantAvailability;
