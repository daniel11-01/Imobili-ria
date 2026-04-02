function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.authUser ? req.authUser.role : null;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Sem permissao para esta operacao." });
    }

    return next();
  };
}

module.exports = {
  requireRole,
};
