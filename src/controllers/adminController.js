import User from '../models/User.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import catchAsync from '../utils/catchAsync.js';

export const getStatistics = catchAsync(async (req, res) => {
  const [
    totalUsers,
    totalOrganizers,
    totalActivities,
    totalRegistrations,
    activeActivities,
    finishedActivities,
    cancelledActivities,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'organizer' }),
    Event.countDocuments(),
    Registration.countDocuments({ status: 'confirmed' }),
    Event.countDocuments({ status: 'active' }),
    Event.countDocuments({ status: 'finished' }),
    Event.countDocuments({ status: 'cancelled' }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalOrganizers,
      totalActivities,
      totalRegistrations,
      activeActivities,
      finishedActivities,
      cancelledActivities,
    },
  });
});
