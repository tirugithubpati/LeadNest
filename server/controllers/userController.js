const User = require('../models/User');

exports.searchUsers = async (req, res) => {
  try {
    const searchTerm = req.query.searchTerm || req.query.query;
    const currentUserId = req.user._id; 
    console.log('Searching users with term:', searchTerm, 'excluding user:', currentUserId);

    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).json({
        message: 'Search term must be at least 2 characters long'
      });
    }

    const searchPattern = new RegExp(searchTerm, 'i');

    const users = await User.find({
      _id: { $ne: currentUserId }, 
      $or: [
        { username: searchPattern },
        { email: searchPattern }
      ]
    })
    .select('username email fullName _id') 
    .limit(10); 

    console.log(`Found ${users.length} users matching search term (excluding current user)`);
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({
      message: 'Error searching users',
      error: error.message
    });
  }
}; 