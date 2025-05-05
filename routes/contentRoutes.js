const express = require('express');
const router = express.Router();
const { getContents, setContent, updateContent, deleteContent } = require('../controllers/contentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getContents).post(protect, setContent);
router.route('/:id').put(protect, updateContent).delete(protect, deleteContent);

module.exports = router;
