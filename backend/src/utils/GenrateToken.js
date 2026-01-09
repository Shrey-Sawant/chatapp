import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, "shreyasawant0107nosfaratu@$homful$%ewn42", { expiresIn: "7d" });

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "none",
        secure:  true,
    });

    return token;
}