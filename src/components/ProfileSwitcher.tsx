import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Baby, 
} from 'lucide-react';
import { useApp, ProfileItem } from '../store';
import { 
  PRESET_AVATARS, 
  DICEBEAR_STYLES, 
  getUserAvatarUrl, 
} from '../lib/avatars';
import { cn } from '../lib/utils';

interface ProfileSwitcherProps {
  onClose?: () => void;
  isOpen?: boolean;
}

export function ProfileSwitcher({ onClose, isOpen = true }: ProfileSwitcherProps) {
  const {
    profiles,
    activeProfileId,
    switchProfile,
    createProfile,
    updateProfile,
    deleteProfile,
  } = useApp();

  const [isManaging, setIsManaging] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ProfileItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formAvatar, setFormAvatar] = useState('constellation-orion');
  const [formIsKids, setFormIsKids] = useState(false);
  const [formMaxAge, setFormMaxAge] = useState('PG');
  const [selectedAvatarStyle, setSelectedAvatarStyle] = useState('constellation');
  const [avatarSeed, setAvatarSeed] = useState('Cinephile');

  const openCreateModal = () => {
    setFormName('');
    setFormAvatar('constellation-orion');
    setFormIsKids(false);
    setFormMaxAge('PG');
    setSelectedAvatarStyle('constellation');
    setAvatarSeed(`User_${Math.floor(Math.random() * 1000)}`);
    setIsCreating(true);
  };

  const openEditModal = (prof: ProfileItem) => {
    setEditingProfile(prof);
    setFormName(prof.name);
    setFormAvatar(prof.avatar);
    setFormIsKids(Boolean(prof.isKids));
    setFormMaxAge(prof.maxAgeRating || 'PG');
    setIsCreating(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAvatar = formAvatar.includes(':') 
      ? formAvatar 
      : `${selectedAvatarStyle}:${avatarSeed || formName || 'Cinephile'}`;

    if (isCreating) {
      const newId = createProfile({
        name: formName.trim() || 'New Profile',
        avatar: formAvatar.startsWith('http') || PRESET_AVATARS.some(a => a.id === formAvatar) ? formAvatar : finalAvatar,
        isKids: formIsKids,
        maxAgeRating: formIsKids ? formMaxAge : undefined,
      });
      setIsCreating(false);
      if (!isManaging) {
        switchProfile(newId);
        if (onClose) onClose();
      }
    } else if (editingProfile) {
      updateProfile(editingProfile.id, {
        name: formName.trim() || editingProfile.name,
        avatar: formAvatar.startsWith('http') || PRESET_AVATARS.some(a => a.id === formAvatar) ? formAvatar : finalAvatar,
        isKids: formIsKids,
        maxAgeRating: formIsKids ? formMaxAge : undefined,
      });
      setEditingProfile(null);
    }
  };

  const handleSelectProfile = (prof: ProfileItem) => {
    if (isManaging) {
      openEditModal(prof);
    } else {
      switchProfile(prof.id);
      if (onClose) onClose();
      else window.location.hash = '#home';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto min-h-screen">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header / Dismiss */}
      <div className="w-full max-w-5xl flex items-center justify-between py-4 px-2 absolute top-0 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2">
          <span className="font-display font-black text-lg tracking-wider text-brand">CINEVAULT</span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full glass border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-brand/40 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center my-auto py-12">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10 sm:mb-14"
        >
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-foreground tracking-tight mb-2">
            {isManaging ? 'Manage Profiles' : "Who's watching?"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            {isManaging
              ? 'Select a profile to edit its name, avatar, and kids restrictions.'
              : 'Choose your profile to access your personalized watchlist and watch history.'}
          </p>
        </motion.div>

        {/* Profiles Grid */}
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 sm:gap-8 items-start justify-center mb-12"
        >
          {profiles.map((prof, index) => {
            const isActive = prof.id === activeProfileId;
            const avatarUrl = getUserAvatarUrl(prof.avatar, prof.name);

            return (
              <motion.div
                key={prof.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group flex flex-col items-center cursor-pointer relative"
                onClick={() => handleSelectProfile(prof)}
              >
                {/* Avatar Box */}
                <div
                  className={cn(
                    "relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-1 transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center",
                    isActive && !isManaging 
                      ? "ring-4 ring-brand shadow-[0_0_25px_var(--theme-accent-glow,rgba(232,133,42,0.35))]" 
                      : "ring-2 ring-white/10 group-hover:ring-white/40",
                    isManaging && "hover:ring-brand/80"
                  )}
                >
                  <div className="w-full h-full rounded-[22px] overflow-hidden bg-card/90 border border-white/10 flex items-center justify-center relative">
                    <img
                      src={avatarUrl}
                      alt={prof.name}
                      className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-110"
                    />

                    {/* Kids Pill Tag */}
                    {prof.isKids && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-gradient-to-r from-pink-500 to-amber-500 text-[10px] font-black tracking-wider text-white shadow-md uppercase">
                        KIDS
                      </div>
                    )}

                    {/* Manage Mode Overlay */}
                    {isManaging && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center transition-opacity">
                        <div className="w-10 h-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                          <Pencil className="w-5 h-5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete Quick Action in Manage Mode */}
                  {isManaging && profiles.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete profile "${prof.name}"?`)) {
                          deleteProfile(prof.id);
                        }
                      }}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-600 border-2 border-background text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-lg cursor-pointer"
                      title="Delete profile"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Profile Name & Tag */}
                <div className="mt-3 text-center">
                  <span className="block text-sm sm:text-base font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate max-w-[120px]">
                    {prof.name}
                  </span>
                  {isActive && !isManaging && (
                    <span className="inline-block text-[10px] font-medium text-brand mt-0.5">
                      Active
                    </span>
                  )}
                  {prof.isKids && (
                    <span className="block text-[10px] text-pink-400 font-semibold">
                      {prof.maxAgeRating ? `${prof.maxAgeRating} & under` : 'Family Safe'}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Add Profile Card */}
          {profiles.length < 6 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: profiles.length * 0.05 }}
              onClick={openCreateModal}
              className="group flex flex-col items-center cursor-pointer"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl border-2 border-dashed border-white/20 group-hover:border-brand/60 bg-white/[0.02] group-hover:bg-brand/5 transition-all duration-300 flex items-center justify-center group-hover:scale-105">
                <div className="w-12 h-12 rounded-full bg-white/5 group-hover:bg-brand/20 border border-white/10 group-hover:border-brand/40 flex items-center justify-center text-muted-foreground group-hover:text-brand transition-all">
                  <Plus className="w-6 h-6" />
                </div>
              </div>
              <span className="mt-3 block text-sm sm:text-base font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                Add Profile
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Action Toggle Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <button
            onClick={() => setIsManaging(!isManaging)}
            className={cn(
              "px-8 py-3 rounded-2xl font-bold text-sm tracking-wide transition-all uppercase border cursor-pointer",
              isManaging
                ? "bg-brand text-brand-foreground border-brand hover:opacity-90 shadow-lg shadow-brand/20"
                : "glass border-white/20 text-muted-foreground hover:text-foreground hover:border-white/40"
            )}
          >
            {isManaging ? 'Done' : 'Manage Profiles'}
          </button>
        </motion.div>
      </div>

      {/* Add / Edit Profile Modal */}
      <AnimatePresence>
        {(isCreating || editingProfile) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[260] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-card border border-border rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
                <h3 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
                  {isCreating ? <Plus className="w-5 h-5 text-brand" /> : <Pencil className="w-5 h-5 text-brand" />}
                  {isCreating ? 'Add Profile' : 'Edit Profile'}
                </h3>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingProfile(null);
                  }}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                {/* Avatar Preview & Selection */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Choose Profile Avatar
                  </label>

                  {/* Preset Avatars Row */}
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5 mb-4">
                    {PRESET_AVATARS.slice(0, 12).map((av) => (
                      <button
                        type="button"
                        key={av.id}
                        onClick={() => setFormAvatar(av.id)}
                        className={cn(
                          "w-12 h-12 rounded-2xl p-1 bg-black/40 border transition-all cursor-pointer overflow-hidden",
                          formAvatar === av.id
                            ? "border-brand ring-2 ring-brand/40 scale-105"
                            : "border-white/10 hover:border-white/30"
                        )}
                      >
                        <img src={av.url} alt={av.name} className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>

                  {/* Custom DiceBear Style Picker */}
                  <div className="glass border border-white/10 rounded-2xl p-3 bg-white/[0.02]">
                    <div className="text-xs text-muted-foreground font-medium mb-2">Or pick a dynamic style:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {DICEBEAR_STYLES.map((st) => (
                        <button
                          type="button"
                          key={st.id}
                          onClick={() => {
                            setSelectedAvatarStyle(st.id);
                            setFormAvatar(`${st.id}:${avatarSeed || formName || 'Cinephile'}`);
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                            selectedAvatarStyle === st.id
                              ? "bg-brand text-brand-foreground font-bold"
                              : "bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10"
                          )}
                        >
                          {st.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Profile Name Input */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Profile Name
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (formAvatar.includes(':')) {
                        setFormAvatar(`${selectedAvatarStyle}:${e.target.value}`);
                      }
                    }}
                    placeholder="e.g. Alex, Mom, Movie Buff"
                    className="w-full px-4 py-3 rounded-2xl bg-muted/50 border border-border focus:border-brand focus:ring-1 focus:ring-brand text-foreground placeholder:text-muted-foreground text-sm font-medium outline-none transition-all"
                  />
                </div>

                {/* Kids Mode Toggle */}
                <div className="glass border border-pink-500/20 bg-pink-500/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/30 text-pink-400 flex items-center justify-center shrink-0">
                      <Baby className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground flex items-center gap-2">
                        Kids Profile
                        <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-pink-500 text-white uppercase">
                          Safe Mode
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Automatically filters out mature ratings & shows family-friendly titles.
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    id="kidsModeToggle"
                    checked={formIsKids}
                    onChange={(e) => setFormIsKids(e.target.checked)}
                    className="w-5 h-5 accent-pink-500 rounded cursor-pointer"
                  />
                </div>

                {/* Max Age Rating (if Kids is checked) */}
                {formIsKids && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Maximum Allowed Age Rating
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'G', label: 'G / TV-Y (Little Kids)' },
                        { id: 'PG', label: 'PG / TV-PG (Older Kids)' },
                        { id: 'PG-13', label: 'PG-13 / TV-14 (Teens)' },
                      ].map((rate) => (
                        <button
                          type="button"
                          key={rate.id}
                          onClick={() => setFormMaxAge(rate.id)}
                          className={cn(
                            "px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer",
                            formMaxAge === rate.id
                              ? "border-pink-500 bg-pink-500/20 text-pink-300 shadow-sm"
                              : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {rate.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-border gap-3">
                  {editingProfile && profiles.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${editingProfile.name}"?`)) {
                          deleteProfile(editingProfile.id);
                          setEditingProfile(null);
                        }
                      }}
                      className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingProfile(null);
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-brand text-brand-foreground text-xs font-bold hover:opacity-90 transition-opacity shadow-md shadow-brand/20 cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
