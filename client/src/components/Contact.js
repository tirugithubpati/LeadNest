import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import emailjs from "@emailjs/browser";
import { useAuth } from '../context/AuthContext';
import { getCurrentUser } from '../api/authApi';
import { Link } from 'react-router-dom';
import "react-toastify/dist/ReactToastify.css";
import LoadingAnimation from './LoadingAnimation';
import { FaEnvelope, FaGithub, FaLinkedin } from 'react-icons/fa';
import '../styles/Contact.css';
import Footer from './Footer';

const Contact = () => {
    const { user } = useAuth();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [userDetails, setUserDetails] = useState(null);

    useEffect(() => {
        const fetchUserDetails = async () => {
            try {
                const response = await getCurrentUser();
                setUserDetails(response.data);
            } catch (error) {
                console.error("Error fetching user details:", error);
                toast.error("Failed to load user details");
            }
        };
        fetchUserDetails();
    }, []);

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!message) {
            return toast.error("Please enter your message");
        }

        setLoading(true);
        try {
            const templateParams = {
                from_name: userDetails?.fullName || user?.fullName,
                from_email: userDetails?.email || user?.email,
                message: message
            };

            await emailjs.send(
                process.env.REACT_APP_EMAILJS_SERVICE_ID,
                process.env.REACT_APP_EMAILJS_TEMPLATE_ID,
                templateParams,
                process.env.REACT_APP_EMAILJS_PUBLIC_API
            );
            
            setMessage("");
            toast.success("Message sent successfully!");
        } catch (error) {
            console.error("Error sending email:", error);
            toast.error("Failed to send message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-wrapper">
            <div className="contact-header">
                <div className="contact-header-content">
                    <div className="contact-header-left">
                        <h1>Contact Us</h1>
                        <p className="contact-subtitle">Get in touch with our support team</p>
                    </div>
                    <Link to="/dashboard" className="dashboard-back-btn">
                        <i className="fas fa-arrow-left"></i> Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="contact-section">
                <div className="contact-container">
                    <div className="contact-info">
                        <h3>Get in Touch</h3>
                        <p>Whether it's feedback, support, feature ideas, or collaboration — we're here for every sprint. Let's keep building better, together.</p>
                        
                        <div className="contact-details">
                            <div className="contact-item">
                                <i className="fas fa-envelope"></i>
                                <span>Mail : karmasync.official@gmail.com</span>
                            </div>
                            <div className="contact-item">
                                <i className="fas fa-phone"></i>
                                <span>Phone : +91 876 3232 589</span>
                            </div>
                        </div>
                    </div>

                        <form onSubmit={submitHandler} className="contact-form">
                            <div className="form-group">
                                <label>Message</label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="form-control"
                                    rows="5"
                                    placeholder="Write your message here..."
                                    required
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin"></i> Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane"></i> Send Message
                                    </>
                                )}
                            </button>
                        </form>
                </div>
            </div>
            <ToastContainer position="bottom-right" theme="light" />
            <Footer />
        </div>
    );
};

export default Contact; 