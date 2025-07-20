import React from "react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="dashboard-footer">
      &copy; {year} KarmaSync. Licensed under{" "}
      <a    
        href="https://github.com/bsurajpatra/KarmaSync_Info/blob/main/LICENSE"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        MIT License
      </a>.
    </footer>
  );
};

export default Footer;
