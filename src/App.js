import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  Home, 
  Clock, 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  Gift, 
  Trophy, 
  Star, 
  Award, 
  Ticket, 
  MapPin, 
  UtensilsCrossed, 
  Percent, 
  Wallet, 
  Search, 
  User, 
  ArrowUp, 
  Plus, 
  Send, 
  ShoppingCart, 
  Phone, 
  Users, 
  MoreHorizontal,
  Car,
  Package
} from 'lucide-react';import { Alert, AlertTitle, AlertDescription } from "./components/ui/alert";

const GojekHomeInterface = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm mb-4">
      {/* Search Bar */}
      <div className="bg-green-700 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white rounded-full px-4 py-2 flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400">Find services, food, or places</span>
          </div>
          <User className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* GoPay Card */}
      <div className="p-4">
        <div className="bg-cyan-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1 bg-white/20 rounded">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="font-semibold">Gopay</span>
          </div>
          <div className="text-xl font-bold mb-1">0</div>
          <div className="text-red-300 text-sm mb-4">Ayo Aktifin GoPay kamu</div>
          <div className="flex justify-between">
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-2 rounded-full mb-1">
                <ArrowUp className="w-5 h-5" />
              </div>
              <span className="text-xs">Bayar</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-2 rounded-full mb-1">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs">Top Up</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-white/20 p-2 rounded-full mb-1">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-xs">Eksplor</span>
            </div>
          </div>
        </div>

        {/* Service Icons */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <ServiceIcon icon={<UtensilsCrossed className="w-6 h-6 text-green-600" />} label="GoRide" bgColor="bg-green-50" />
          <ServiceIcon icon={<Car className="w-6 h-6 text-green-600" />} label="GoCar" bgColor="bg-green-50" />
          <ServiceIcon icon={<UtensilsCrossed className="w-6 h-6 text-red-500" />} label="GoFood" bgColor="bg-red-50" />
          <ServiceIcon icon={<Package className="w-6 h-6 text-green-600" />} label="GoSend" bgColor="bg-green-50" />
          <ServiceIcon icon={<ShoppingCart className="w-6 h-6 text-red-500" />} label="GoMart" bgColor="bg-red-50" />
          <ServiceIcon icon={<Phone className="w-6 h-6 text-blue-500" />} label="GoPulsa" bgColor="bg-blue-50" />
          <ServiceIcon icon={<Users className="w-6 h-6 text-purple-500" />} label="GoClub" bgColor="bg-purple-50" />
          <ServiceIcon icon={<MoreHorizontal className="w-6 h-6 text-gray-500" />} label="Lainnya" bgColor="bg-gray-50" />
        </div>
      </div>
    </div>
  );
};

const ServiceIcon = ({ icon, label, bgColor }) => (
  <div className="flex flex-col items-center">
    <div className={`p-3 rounded-xl ${bgColor} mb-1`}>
      {icon}
    </div>
    <span className="text-xs text-gray-600">{label}</span>
  </div>
);

const QuestJourney = () => {
  const [loading, setLoading] = useState(false);
  const [quest, setQuest] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [lastCompletionDate, setLastCompletionDate] = useState(null);
  const [activeTab, setActiveTab] = useState('Journey');
  const [userContext, setUserContext] = useState(null);
  const userId = '000000006'; // Example user ID

  useEffect(() => {
    fetchUserContext();
  }, []);

  const fetchUserContext = async () => {
    try {
      const response = await fetch(`http://localhost:5000/user-stats/${userId}`);
      const data = await response.json();
      setUserContext(data);
    } catch (err) {
      setError('Failed to load user context');
    }
  };

  const calculateProgress = () => quest ? Math.round((completedTasks.length / quest.objectives.length) * 100) : 0;

  const handleTaskClick = async (objective) => {
    if (completedTasks.includes(objective.id)) return;
    
    try {
      const response = await fetch(`http://localhost:5000/complete-quest/${userId}/${quest.quest_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      });

      if (!response.ok) throw new Error('Failed to update quest progress');

      setCompletedTasks(prev => [...prev, objective.id]);
      setPoints(prev => prev + objective.points);
      setLastCompletionDate(new Date().toISOString());
      updateStreak();
      window.open(getPlatformUrl(objective.platform), '_blank');
    } catch (err) {
      setError('Failed to complete task');
    }
  };

  const updateStreak = () => {
    const today = new Date();
    if (lastCompletionDate) {
      const lastDate = new Date(lastCompletionDate);
      const dayDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) setStreak(prev => prev + 1);
      else if (dayDiff > 1) setStreak(1);
    } else {
      setStreak(1);
    }
  };

  const getPlatformColor = (platform) => {
    const colors = {
      'GoFood': 'text-red-600 bg-red-50',
      'GoRide': 'text-green-600 bg-green-50',
      'GoCar': 'text-blue-600 bg-blue-50',
      'GoPay': 'text-purple-600 bg-purple-50'
    };
    return colors[platform] || 'text-gray-600 bg-gray-50';
  };

  const getPlatformUrl = (platform) => {
    const urls = {
      'GoFood': 'https://gofood.co.id',
      'GoRide': 'https://gojek.com/goride',
      'GoCar': 'https://gojek.com/gocar',
      'GoPay': 'https://gojek.com/gopay'
    };
    return urls[platform] || 'https://gojek.com';
  };

  const generateQuest = async () => {
    setLoading(true);
    setError(null);
    setCompletedTasks([]);
    setPoints(0);
    
    try {
      const response = await fetch(`http://localhost:5000/generate-quest/${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setQuest(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setProgress(calculateProgress());
  }, [completedTasks]);

  const renderPromotions = () => (
    <div className="grid grid-cols-3 gap-2">
      <div className="flex items-center gap-1 text-sm">
        <Ticket className="w-4 h-4 text-red-500" />
        <span className="truncate">
          {userContext.food_treatment !== '0' ? userContext.food_treatment : 'No promo'}
        </span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <Ticket className="w-4 h-4 text-green-500" />
        <span className="truncate">
          {userContext.ride_treatment !== '0' ? userContext.ride_treatment : 'No promo'}
        </span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <Ticket className="w-4 h-4 text-blue-500" />
        <span className="truncate">
          {userContext.car_treatment !== '0' ? userContext.car_treatment : 'No promo'}
        </span>
      </div>
    </div>
  );

  const renderFavoritePlaces = () => (
    <div className="flex flex-col gap-2">
      {userContext.RIDE_PREDICTION_PLACE !== 'null' && (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 text-green-600">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">GoRide:</span>
          </div>
          <span className="truncate">{userContext.RIDE_PREDICTION_PLACE}</span>
        </div>
      )}
      
      {userContext.CAR_PREDICTION_PLACE !== 'null' && (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 text-blue-600">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">GoCar:</span>
          </div>
          <span className="truncate">{userContext.CAR_PREDICTION_PLACE}</span>
        </div>
      )}
  
      {userContext.FOOD_PREDICTION_PLACE !== 'null' && (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 text-red-600">
            <UtensilsCrossed className="w-4 h-4" />
            <span className="font-medium">GoFood:</span>
          </div>
          <span className="truncate">{userContext.FOOD_PREDICTION_PLACE}</span>
        </div>
      )}
    </div>
  );  

  const renderTaskCard = (objective) => {
    const getVoucherByPlatform = (platform) => {
      if (!userContext) return null;
      
      switch (platform) {
        case 'GoFood':
          return userContext.food_treatment !== '0' ? userContext.food_treatment : null;
        case 'GoRide':
          return userContext.ride_treatment !== '0' ? userContext.ride_treatment : null;
        case 'GoCar':
          return userContext.car_treatment !== '0' ? userContext.car_treatment : null;
        default:
          return null;
      }
    };
  
    return (
      <div 
        key={objective.id}
        className="bg-white rounded-xl p-4 shadow-sm mb-4 hover:shadow-md transition-all"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full ${getPlatformColor(objective.platform)}`}>
            {objective.platform === 'GoPay' ? <Ticket className="w-6 h-6" /> : 
             objective.platform === 'GoFood' ? <UtensilsCrossed className="w-6 h-6" /> :
             <Gift className="w-6 h-6" />}
          </div>
          
          <div className="flex-1">
            {/* Platform Badge */}
            <div className="flex items-center gap-2 mb-2">
              {completedTasks.includes(objective.id) ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300" />
              )}
              <span className={`px-2 py-1 rounded-full text-sm ${getPlatformColor(objective.platform)}`}>
                {objective.platform}
              </span>
            </div>
  
            {/* Task Description */}
            <h3 className="font-medium text-gray-900 mb-2">{objective.description}</h3>
  
            {/* Points and Rewards */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center text-yellow-500">
                <Star className="w-4 h-4 mr-1" />
                {objective.points} points
              </div>
              {objective.promotion && (
                <div className="flex items-center text-green-500">
                  <Gift className="w-4 h-4 mr-1" />
                  {objective.promotion}
                </div>
              )}
            </div>
  
            {/* Location if available */}
            {objective.location && (
              <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                {objective.location}
              </div>
            )}
  
            {/* Action Button */}
            {!completedTasks.includes(objective.id) && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskClick(objective);
                }}
                className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2"
              >
                Start Task
                <ExternalLink className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderJourneyTab = () => (
    <div className="p-4">
      <GojekHomeInterface />

      {/* GoPay Offer Alert - First */}
      <Alert className="mb-4 border-green-100 bg-green-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-100 rounded-full">
            <Wallet className="h-4 w-4 text-green-600" />
          </div>
          <div className="flex-1">
            <AlertTitle className="text-green-800 font-semibold">
              Exclusive GoPay Offer! 🎉
            </AlertTitle>
            <AlertDescription className="text-green-700 mt-1">
              Use GoPay to unlock up to 50% discount on all Gojek services. Start your journey now!
            </AlertDescription>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-sm text-green-700">
          <Percent className="h-4 w-4" />
          <span>Limited time offer</span>
        </div>
      </Alert>

      {/* Points and Progress Card - Second */}
      <div className="bg-white p-4 rounded-xl mb-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-bold">{points} Points</h2>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {streak} day streak 🔥
              </div>
            </div>
            {quest && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Progress</div>
                <div className="text-lg font-bold text-green-500">{progress}%</div>
              </div>
            )}
          </div>

          {quest && (
            <>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">{quest.narrative}</p>
            </>
          )}
        </div>
      </div>

      {!quest ? (
        <button
          onClick={generateQuest}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Journey...
            </div>
          ) : (
            'Start New Quest'
          )}
        </button>
      ) : (
        quest.objectives.map(renderTaskCard)
      )}
    </div>
  );

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen pb-16">
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      {renderJourneyTab()}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
        <div className="flex justify-between max-w-md mx-auto">
          {['Journey', 'History', 'Rewards'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 p-3 text-center ${
                activeTab === tab ? 'text-green-500' : 'text-gray-500'
              }`}
            >
              {tab === 'Journey' && <Home className="h-5 w-5 mx-auto" />}
              {tab === 'History' && <Clock className="h-5 w-5 mx-auto" />}
              {tab === 'Rewards' && <Trophy className="h-5 w-5 mx-auto" />}
              <span className="text-xs mt-1 block">{tab}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuestJourney;