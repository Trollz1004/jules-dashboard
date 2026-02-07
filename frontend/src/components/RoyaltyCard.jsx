import React, { useState, useEffect } from 'react';
import './RoyaltyCard.css';

/**
 * RoyaltyCard Component
 *
 * Displays a Royalty Founder Card with unique animations
 * Only 5 will ever exist: Ace, King, Queen, Jack, Joker
 */

const CARD_SYMBOLS = {
  ACE: '🂱',
  KING: '🂾',
  QUEEN: '🂽',
  JACK: '🂻',
  JOKER: '🃏'
};

const RoyaltyCard = ({
  cardType = 'ACE',
  userName = 'Founder',
  tagline = 'Royalty Founder',
  profileImage = null,
  onSwipeLeft = null,
  onSwipeRight = null
}) => {
  const [isShattered, setIsShattered] = useState(false);
  const [showReward, setShowReward] = useState(false);

  const cardClass = cardType.toLowerCase();

  // Handle swipe left (rejection) - triggers shatter animation
  const handleSwipeLeft = () => {
    setIsShattered(true);

    // Show reward after shatter
    setTimeout(() => {
      setShowReward(true);
    }, 800);

    // Clean up and call callback
    setTimeout(() => {
      setIsShattered(false);
      setShowReward(false);
      if (onSwipeLeft) onSwipeLeft();
    }, 3000);
  };

  // Handle swipe right (like)
  const handleSwipeRight = () => {
    if (onSwipeRight) onSwipeRight();
  };

  return (
    <>
      <div className="royalty-card-wrapper">
        <div className={`royalty-card ${cardClass}`}>
          {/* Animated Border */}
          <div className="royalty-border"></div>

          {/* Rising Hearts Effect */}
          <div className="rising-hearts">
            <span className="heart">💕</span>
            <span className="heart">💗</span>
            <span className="heart">💖</span>
            <span className="heart">💝</span>
            <span className="heart">❤️</span>
            <span className="heart">💓</span>
          </div>

          {/* Founder Badge */}
          <div className="founder-badge">
            {cardType} of Hearts
          </div>

          {/* Profile Image */}
          <div className="royalty-profile-image">
            {profileImage ? (
              <img src={profileImage} alt={userName} />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #333, #111)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '64px'
              }}>
                {CARD_SYMBOLS[cardType]}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="royalty-info">
            <div className="royalty-name">{userName}</div>
            <div className="royalty-tagline">{tagline}</div>
          </div>

          {/* Card Type Symbol */}
          <div className="card-type-indicator">
            {CARD_SYMBOLS[cardType]}
          </div>
        </div>

        {/* Demo Swipe Buttons (for testing) */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '20px'
        }}>
          <button
            onClick={handleSwipeLeft}
            style={{
              padding: '15px 30px',
              borderRadius: '50px',
              border: 'none',
              background: 'linear-gradient(135deg, #DC143C, #8B0000)',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 5px 20px rgba(220, 20, 60, 0.4)'
            }}
          >
            ✕ Pass
          </button>
          <button
            onClick={handleSwipeRight}
            style={{
              padding: '15px 30px',
              borderRadius: '50px',
              border: 'none',
              background: 'linear-gradient(135deg, #00C853, #00E676)',
              color: 'white',
              fontSize: '18px',
              cursor: 'pointer',
              boxShadow: '0 5px 20px rgba(0, 200, 83, 0.4)'
            }}
          >
            ♥ Like
          </button>
        </div>
      </div>

      {/* Shatter Animation Overlay */}
      <div className={`shatter-container ${isShattered ? 'active' : ''}`}>
        <div className="shatter-heart">💔</div>
        <span className="shard">💔</span>
        <span className="shard">💔</span>
        <span className="shard">💔</span>
        <span className="shard">💔</span>
        <span className="shard">💔</span>
        <span className="shard">💔</span>
      </div>

      {/* Reward Notification */}
      {showReward && (
        <div className="shard-reward">
          +3 Heart Shards Collected! 💎
        </div>
      )}
    </>
  );
};

/**
 * RoyaltyCardPreview - Shows all 5 cards in a gallery
 */
export const RoyaltyCardGallery = () => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '40px',
      padding: '40px',
      background: '#0a0a0a',
      minHeight: '100vh'
    }}>
      <RoyaltyCard cardType="ACE" userName="The Ace" tagline="First to Rise" />
      <RoyaltyCard cardType="KING" userName="The King" tagline="Rules the Heart" />
      <RoyaltyCard cardType="QUEEN" userName="The Queen" tagline="Grace & Power" />
      <RoyaltyCard cardType="JACK" userName="The Jack" tagline="Wild Card" />
      <RoyaltyCard cardType="JOKER" userName="The Joker" tagline="One of a Kind" />
    </div>
  );
};

export default RoyaltyCard;
