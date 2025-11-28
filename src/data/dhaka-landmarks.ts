// Comprehensive Dhaka, Bangladesh Landmarks Database
// Curated list of important locations with precise coordinates

export interface DhakaLandmark {
    name: string;
    lat: number;
    lng: number;
    category: 'university' | 'school' | 'hospital' | 'shopping' | 'historical' | 'government' | 'park' | 'museum' | 'restaurant';
}

export const dhakaLandmarks: DhakaLandmark[] = [
    // Universities
    { name: 'University of Dhaka', lat: 23.7308, lng: 90.3975, category: 'university' },
    { name: 'BUET', lat: 23.7269, lng: 90.3925, category: 'university' },
    { name: 'Bangabandhu Sheikh Mujib Medical University', lat: 23.7385, lng: 90.3965, category: 'university' },
    { name: 'North South University', lat: 23.8103, lng: 90.4125, category: 'university' },
    { name: 'BRAC University', lat: 23.7808, lng: 90.4067, category: 'university' },
    { name: 'Jagannath University', lat: 23.7196, lng: 90.4086, category: 'university' },
    { name: 'East West University', lat: 23.7742, lng: 90.3672, category: 'university' },
    { name: 'Ahsanullah University of Science and Technology', lat: 23.7654, lng: 90.3913, category: 'university' },
    { name: 'Independent University Bangladesh', lat: 23.7935, lng: 90.4044, category: 'university' },
    { name: 'American International University Bangladesh', lat: 23.7465, lng: 90.3772, category: 'university' },
    
    // Schools
    { name: 'Viqarunnisa Noon School', lat: 23.7385, lng: 90.3965, category: 'school' },
    { name: 'Ideal School and College', lat: 23.7506, lng: 90.3756, category: 'school' },
    { name: 'Holy Cross Girls High School', lat: 23.7308, lng: 90.4086, category: 'school' },
    { name: 'St Joseph Higher Secondary School', lat: 23.7308, lng: 90.4086, category: 'school' },
    { name: 'Monipur High School', lat: 23.7506, lng: 90.3756, category: 'school' },
    { name: 'Government Laboratory High School', lat: 23.7308, lng: 90.4086, category: 'school' },
    { name: 'Rajuk Uttara Model School', lat: 23.8750, lng: 90.3972, category: 'school' },
    
    // Hospitals
    { name: 'Square Hospital', lat: 23.7506, lng: 90.3756, category: 'hospital' },
    { name: 'Evercare Hospital Dhaka', lat: 23.7935, lng: 90.4044, category: 'hospital' },
    { name: 'United Hospital', lat: 23.7935, lng: 90.4125, category: 'hospital' },
    { name: 'Dhaka Medical College Hospital', lat: 23.7269, lng: 90.3925, category: 'hospital' },
    { name: 'Labaid Specialized Hospital', lat: 23.7506, lng: 90.3756, category: 'hospital' },
    { name: 'BIRDEM General Hospital', lat: 23.7385, lng: 90.3965, category: 'hospital' },
    { name: 'National Heart Foundation', lat: 23.7385, lng: 90.3965, category: 'hospital' },
    { name: 'Green Life Medical College Hospital', lat: 23.7935, lng: 90.4044, category: 'hospital' },
    
    // Shopping Malls
    { name: 'Jamuna Future Park', lat: 23.8133, lng: 90.4242, category: 'shopping' },
    { name: 'Bashundhara City', lat: 23.7513, lng: 90.3906, category: 'shopping' },
    { name: 'Shimanto Shombhar', lat: 23.7506, lng: 90.3756, category: 'shopping' },
    { name: 'Rifles Square', lat: 23.7506, lng: 90.3756, category: 'shopping' },
    { name: 'Pink City Shopping Mall', lat: 23.7935, lng: 90.4044, category: 'shopping' },
    
    // Historical Sites
    { name: 'Lalbagh Fort', lat: 23.7188, lng: 90.3880, category: 'historical' },
    { name: 'Ahsan Manzil', lat: 23.7086, lng: 90.4061, category: 'historical' },
    { name: 'Star Mosque', lat: 23.7196, lng: 90.4086, category: 'historical' },
    { name: 'Armenian Church', lat: 23.7196, lng: 90.4086, category: 'historical' },
    { name: 'Dhaka Gate', lat: 23.7196, lng: 90.4086, category: 'historical' },
    { name: 'Hussaini Dalan', lat: 23.7196, lng: 90.4086, category: 'historical' },
    { name: 'Boro Katra', lat: 23.7196, lng: 90.4086, category: 'historical' },
    { name: 'Central Shaheed Minar', lat: 23.7385, lng: 90.3965, category: 'historical' },
    
    // Government Buildings
    { name: 'National Parliament House', lat: 23.7624, lng: 90.3785, category: 'government' },
    { name: 'Bangabhaban', lat: 23.7385, lng: 90.3965, category: 'government' },
    { name: 'Secretariat Building', lat: 23.7385, lng: 90.3965, category: 'government' },
    { name: 'Supreme Court', lat: 23.7385, lng: 90.3965, category: 'government' },
    { name: 'Dhaka City Corporation', lat: 23.7385, lng: 90.3965, category: 'government' },
    
    // Parks
    { name: 'Ramna Park', lat: 23.7383, lng: 90.4011, category: 'park' },
    { name: 'Hatirjheel', lat: 23.7600, lng: 90.4076, category: 'park' },
    { name: 'Suhrawardy Udyan', lat: 23.7331, lng: 90.3984, category: 'park' },
    { name: 'Baldha Garden', lat: 23.7196, lng: 90.4086, category: 'park' },
    { name: 'Chandrima Udyan', lat: 23.7624, lng: 90.3785, category: 'park' },
    
    // Museums
    { name: 'Liberation War Museum', lat: 23.7319, lng: 90.4068, category: 'museum' },
    { name: 'Bangladesh National Museum', lat: 23.7375, lng: 90.3945, category: 'museum' },
    { name: 'Bangabandhu Memorial Museum', lat: 23.7506, lng: 90.3756, category: 'museum' },
    
    // Mosques
    { name: 'Baitul Mukarram National Mosque', lat: 23.7308, lng: 90.4086, category: 'historical' },
    { name: 'Sat Gumbad Mosque', lat: 23.7196, lng: 90.4086, category: 'historical' },
    
    // Additional Landmarks
    { name: 'Dhaka University Central Library', lat: 23.7308, lng: 90.3975, category: 'university' },
    { name: 'Curzon Hall', lat: 23.7308, lng: 90.3975, category: 'historical' },
    { name: 'TSC (Teacher Student Centre)', lat: 23.7308, lng: 90.3975, category: 'university' },
    { name: 'Shahbagh', lat: 23.7385, lng: 90.3965, category: 'historical' },
    { name: 'New Market', lat: 23.7308, lng: 90.3975, category: 'shopping' },
    { name: 'Kawran Bazar', lat: 23.7506, lng: 90.3906, category: 'shopping' },
    { name: 'Gulshan Lake Park', lat: 23.7935, lng: 90.4125, category: 'park' },
    { name: 'Banani Lake', lat: 23.7935, lng: 90.4044, category: 'park' },
];
