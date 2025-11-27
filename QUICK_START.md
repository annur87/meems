# Quick Start Guide - Memory Athlete Training Program

## 🚀 Getting Started

### 1. Development
```bash
npm run dev
```
Visit: `http://localhost:3000/training`

### 2. Production Build
```bash
npm run build
npm start
```

### 3. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard:
# Settings → Environment Variables
# Copy all NEXT_PUBLIC_* variables from .env.local
```

## 🎮 Game Routes

| Game | Route | Week Focus |
|------|-------|------------|
| Training Hub | `/training` | Overview |
| Number Wall | `/training/number-wall` | Week 1 |
| Card Blitz | `/training/card-blitz` | Week 2 |
| Names Gauntlet | `/training/names-gauntlet` | Week 3 |
| Binary Surge | `/training/binary-surge` | Week 4 |
| Spoken Numbers | `/training/spoken-numbers` | Week 5 |
| Decathlon | `/training/decathlon` | Week 6 |
| Word Palace | `/training/word-palace` | Supplementary |
| Image Vault | `/training/image-vault` | Foundational |
| Analytics | `/analytics` | Progress Tracking |

## 📊 Data Flow

```
User plays game → Results saved to Firebase → Analytics dashboard updates
```

### Firebase Setup (Optional)
If you skip Firebase setup:
- ✅ All games work perfectly
- ❌ No data persistence
- ❌ No analytics

To enable Firebase:
1. Create a Firebase project at https://firebase.google.com
2. Enable Firestore Database
3. Copy config to `.env.local`
4. Add same config to Vercel environment variables

## 🎯 Training Workflow

### Beginner Path
1. **Image Vault** → Build your Major System (00-99)
2. **Number Wall** → Practice with 50 digits, 5 minutes
3. **Card Blitz** → Start at 2 minutes for 52 cards
4. **Analytics** → Track your progress

### Intermediate Path
1. **Image Vault** → Complete PAO System (52 cards)
2. **Names Gauntlet** → Start with 20 faces
3. **Binary Surge** → Practice 60 digits
4. **Spoken Numbers** → Begin at 2s per pair
5. **Word Palace** → 30 words, mixed concrete/abstract

### Advanced Path
1. **All Week Challenges** → Complete 1-5 challenges
2. **Decathlon** → Full 90-minute simulation
3. **Analytics** → Review performance trends
4. **Optimize** → Focus on weakest disciplines

## 🔧 Customization

### Add More Face Images
```bash
# Download additional faces
cd public/faces
wget "https://i.pravatar.cc/300?img=51" -O face_51.jpg
# Repeat for more images
```

### Modify Word Lists
Edit: `src/app/training/word-palace/page.tsx`
- `CONCRETE_WORDS` array
- `ABSTRACT_WORDS` array

### Adjust Challenge Parameters
Each game has a `startWeek[X]Challenge()` function.
Modify the parameters to customize difficulty.

## 📱 Offline Usage

### What Works Offline
- ✅ All game logic
- ✅ Face images (pre-downloaded)
- ✅ Speech synthesis (browser native)
- ✅ Metronome (Web Audio API)

### What Requires Internet
- ❌ Firebase data sync
- ❌ Initial app load (if not PWA)

### Convert to PWA (Future Enhancement)
1. Add `next-pwa` package
2. Create `manifest.json`
3. Add service worker
4. Enable offline caching

## 🐛 Troubleshooting

### Speech Synthesis Not Working
- **Chrome**: Works out of the box
- **Firefox**: May require user interaction first
- **Safari**: Limited voice options
- **Solution**: Click "Start Challenge" to trigger audio context

### Firebase Errors
```
Error: Firebase config missing
```
**Solution**: Check `.env.local` has all `NEXT_PUBLIC_*` variables

### Images Not Loading
```
Error: Image optimization failed
```
**Solution**: Ensure images exist in `public/faces/`
```bash
ls public/faces/ | wc -l  # Should show 50
```

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## 📈 Performance Tips

### Optimize Images Further
```bash
# Install imagemagick
sudo apt install imagemagick

# Compress all faces
cd public/faces
for img in *.jpg; do
  convert "$img" -quality 85 -resize 300x300^ -gravity center -extent 300x300 "optimized_$img"
done
```

### Reduce Bundle Size
- Images are already optimized via Next.js
- Code splitting is automatic
- Consider lazy loading for non-critical components

## 🎨 Customization Examples

### Change Color Scheme
Edit `src/app/globals.css`:
```css
:root {
  --primary: #6366f1;    /* Change to your color */
  --accent: #8b5cf6;     /* Change to your color */
  --success: #10b981;    /* Change to your color */
}
```

### Add New Game
1. Create `src/app/training/[game-name]/page.tsx`
2. Add to `src/app/training/page.tsx` games array
3. Add type to `src/lib/firebase.ts` GameResult interface
4. Update analytics filters

## 📞 Support

### Common Questions

**Q: Can I use this without Firebase?**
A: Yes! All games work perfectly. You just won't have data persistence.

**Q: How do I export my data?**
A: Currently not implemented. Future enhancement.

**Q: Can multiple users share one account?**
A: Currently no user auth. All data goes to one Firebase collection.

**Q: Mobile support?**
A: Yes! Fully responsive design. Works on phones and tablets.

**Q: Can I add my own mnemonic systems?**
A: Currently hardcoded. Future enhancement: localStorage persistence.

---

**Need help?** Check `TRAINING_IMPLEMENTATION.md` for detailed documentation.
