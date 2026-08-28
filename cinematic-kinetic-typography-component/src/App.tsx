import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Stage1Heart from './components/Stage1Heart';
import Stage2Typography from './components/Stage2Typography';
import BirthdayVault from './components/BirthdayVault';

type Stage = 'heart' | 'typography' | 'vault';

export default function App() {
  const [stage, setStage] = useState<Stage>('heart');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Manage body overflow based on stage
  useEffect(() => {
    if (stage === 'vault') {
      document.body.style.overflow = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [stage]);

  const transitionTo = useCallback((nextStage: Stage) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStage(nextStage);
      // Small delay before removing transition overlay for smooth feel
      setTimeout(() => setIsTransitioning(false), 200);
    }, 800);
  }, []);

  const handleHeartComplete = useCallback(() => {
    transitionTo('typography');
  }, [transitionTo]);

  const handleTypographyComplete = useCallback(() => {
    transitionTo('vault');
  }, [transitionTo]);

  return (
    <div className="relative w-full h-full" style={{ background: '#0b0c10' }}>
      {/* Global transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{ background: '#0b0c10' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />
        )}
      </AnimatePresence>

      {/* Stage 1: Heart Prologue */}
      <AnimatePresence>
        {stage === 'heart' && (
          <motion.div
            key="heart"
            className="fixed inset-0 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <Stage1Heart onComplete={handleHeartComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 2: Kinetic Typography */}
      <AnimatePresence>
        {stage === 'typography' && (
          <motion.div
            key="typography"
            className="fixed inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <Stage2Typography onComplete={handleTypographyComplete} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stage 3: Birthday Vault */}
      <AnimatePresence>
        {stage === 'vault' && (
          <motion.div
            key="vault"
            className="fixed inset-0 z-30 overflow-y-auto overflow-x-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
          >
            <BirthdayVault />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
