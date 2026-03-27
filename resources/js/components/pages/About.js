import React from 'react';
import Footer from '../Footer';

export default function About() {
    return (
        <div>
            {/* Hero */}
            <section className="about-hero">
                <div className="container">
                    <div className="about-hero__badge">OUR HISTORY &amp; CRAFTSMANSHIP</div>
                    <h1>A Century of <span>Precision.</span></h1>
                    <p>Discover the men and women who began as a small workshop in Geneva. Our small team has grown into a globally recognized frontrunner for horological excellence.</p>
                </div>
            </section>

            {/* Our Story */}
            <section className="about-section">
                <div className="container">
                    <div className="about-section__grid mobile-stack">
                        <div>
                            <div className="about-section__label">THE BEGINNING</div>
                            <h2>Our Story</h2>
                            <p>Founded with a passion for precision and a dedication to luxury, J&amp;K Watch Store has become a moniker of fine timepieces for over centuries. Our story is one of heritage, craftsmanship, and an unwavering commitment to excellence.</p>
                            <p>From our humble beginnings in a small workshop in Geneva, we have grown into a globally recognized frontrunner for horological excellence. We believe that a watch is more than a tool for measuring time — it is a statement of personal style, a miraculous marvel, and a work of art.</p>
                        </div>
                        <div className="about-section__image">
                            <img
                                src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80"
                                alt="Luxury watch craftsmanship workshop"
                                style={{
                                    width: '100%',
                                    height: '420px',
                                    objectFit: 'cover',
                                    borderRadius: '12px',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                                    display: 'block',
                                }}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="about-section about-section--alt">
                <div className="container">
                    <div className="about-section__grid mobile-stack">
                        <div className="about-section__image">
                            <img
                                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80"
                                alt="Premium watch on clean background"
                                style={{
                                    width: '100%',
                                    height: '420px',
                                    objectFit: 'cover',
                                    borderRadius: '12px',
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.18)',
                                    display: 'block',
                                }}
                            />
                        </div>
                        <div>
                            <div className="about-section__label">OUR PURPOSE</div>
                            <h2>Our Mission</h2>
                            <p>Our mission is simple: to provide horological enthusiasts with unparalleled access to the world's most prestigious timepieces. We believe that a watch is more than a tool for measuring time.</p>
                            <div>
                                <div className="about-section__point">Curating only the highest quality, authentic luxury timepieces.</div>
                                <div className="about-section__point">Fostering a deep appreciation for horological craftsmanship.</div>
                                <div className="about-section__point">Providing an exceptional, personalized client experience.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section style={{ padding: '5rem 0', textAlign: 'center' }}>
                <div className="container">
                    <div className="section__badge">THE EXPERTS</div>
                    <h2 className="section__title">Our Team</h2>
                    <div className="about-team__grid">
                        {[
                            { initials: 'J', name: 'Jay T.', role: 'Admin' },
                            { initials: 'K', name: 'Kit S.', role: 'Admin' },
                        ].map(m => (
                            <div key={m.role} className="about-team__card">
                                <div className="about-team__avatar">{m.initials}</div>
                                <div className="about-team__name">{m.name}</div>
                                <div className="about-team__role" style={{ color: '#C9A84C' }}>{m.role}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
