const { supabaseAdmin } = require('../config/database');

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const retailerId = req.user.id; // assuming JWT middleware sets req.user
    const filePath = `retailer-uploads/${retailerId}/logo-${Date.now()}.png`;

    const { error } = await supabaseAdmin.storage
      .from('public-assets')
      .upload(filePath, req.file.buffer, { upsert: true, contentType: req.file.mimetype });

    if (error) throw error;

    const { data } = supabaseAdmin.storage.from('public-assets').getPublicUrl(filePath);

    return res.json({ success: true, url: data.publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.uploadBanner = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const retailerId = req.user.id;
    const filePath = `retailer-uploads/${retailerId}/banner-${Date.now()}.png`;

    const { error } = await supabaseAdmin.storage
      .from('public-assets')
      .upload(filePath, req.file.buffer, { upsert: true, contentType: req.file.mimetype });

    if (error) throw error;

    const { data } = supabaseAdmin.storage.from('public-assets').getPublicUrl(filePath);

    return res.json({ success: true, url: data.publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
