module.exports.isLoggedIn = (req, res, next) => {
    console.log(req.path,"..",req.originalUrl);
    if(!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl; // Store the original URL to redirect after login
        req.flash('error', 'You must be logged in to create a listing');
        return res.redirect('/admin/login');
    }
    next();
}

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl; // Make it available in the response locals
        console.log("Redirect URL saved:", res.locals.redirectUrl);
    }
    console.log("Redirect URL:", res.locals.redirectUrl);
    next();
}