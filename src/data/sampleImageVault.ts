import { MajorEntry, PaoEntry, Palace } from '@/lib/firebase';

export const SAMPLE_MAJOR_SYSTEM: MajorEntry[] = [
    { id: 'major-00', number: '00', images: ['Sauce', 'Seas'] },
    { id: 'major-01', number: '01', images: ['Suit', 'Seed'] },
    { id: 'major-02', number: '02', images: ['Sun', 'Sane'] },
    { id: 'major-10', number: '10', images: ['Toes', 'Dice'] },
    { id: 'major-11', number: '11', images: ['Toad', 'Dad'] },
    { id: 'major-12', number: '12', images: ['Tin', 'Dune'] },
    { id: 'major-20', number: '20', images: ['Nose', 'Noose'] },
    { id: 'major-21', number: '21', images: ['Net', 'Knot'] },
    { id: 'major-34', number: '34', images: ['Mower', 'Hammer'] },
    { id: 'major-47', number: '47', images: ['Rake', 'Rocket'] },
    { id: 'major-83', number: '83', images: ['Foam', 'Fame'] },
];

export const SAMPLE_PAO_SYSTEM: PaoEntry[] = [
    { id: 'pao-AS', card: 'AS', person: 'Albert Einstein', action: 'Calculating', object: 'Chalkboard' },
    { id: 'pao-2H', card: '2H', person: 'Harry Potter', action: 'Casting', object: 'Wand' },
    { id: 'pao-KC', card: 'KC', person: 'King Kong', action: 'Climbing', object: 'Building' },
    { id: 'pao-7C', card: '7C', person: 'Sherlock Holmes', action: 'Investigating', object: 'Magnifying Glass' },
    { id: 'pao-QS', card: 'QS', person: 'Queen Elizabeth', action: 'Waving', object: 'Crown' },
    { id: 'pao-5D', card: '5D', person: 'Da Vinci', action: 'Painting', object: 'Canvas' },
];

export const SAMPLE_PALACES: Palace[] = [
    { id: 'palace-home', name: 'Home Journey', locations: ['Front Door', 'Hallway', 'Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Balcony', 'Office'] },
    { id: 'palace-office', name: 'Office Route', locations: ['Parking Lot', 'Lobby', 'Elevator', 'Reception', 'Desk', 'Conference Room', 'Break Room', 'Server Room'] },
];

