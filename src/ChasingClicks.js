
import {useState, useEffect} from 'react';

export default function ChasingClicks () {
    
    const [clickData, setClickData] = useState([]);
    const [placeName, setPlaceName] = useState('');


    const handleClick = () => {

        const index = clickData.findIndex(e => e.placeName === placeName);

        setClickData(prevClickData => {
            const arr = [...prevClickData];

            if (index >= 0) {
                arr[index].clicks++;
                
                arr.splice(0, 0, ...arr.splice(index, 1));
            }
            else arr.unshift({placeName, clicks: 1})
                    
            return arr;
        });

        const body = JSON.stringify({
            placeName,
            clicks: index >= 0 ? clickData[index].clicks + 1 : 1
        });

        if (placeName) {
            fetch(`https://click-chaser-backend.onrender.com/locales/${placeName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body
            })
        }
    }


    const ClickChart = () => {

        const Row = ({name, count, headers}) => {
            if (name) {
                
                let nameArr;
                let undisclosed = false;

                if (name === 'Undisclosed Location') {
                    nameArr = [name];
                    undisclosed = true;
                }
                else nameArr = name.split('_')

                return <div className={`row ${headers ? 'headers' : ''}`}>
                    <div className='count-column column'>{count}</div>
                    <div className={`locality-column column ${undisclosed ? 'undisclosed' : ''}`}>{nameArr[0]}</div>
                    {!undisclosed && <>
                        <div className='area-column column'>{nameArr[1]}</div>
                        <div className='country-column column'>{nameArr[2]}</div>
                    </>}
                </div>    
            }
        }

        return (
            <div className='click-chart'>
                <Row name='Locality_Area_Country' count='Clicks' headers={true}/>
                {clickData.map((e, i) => {
                    return <Row name={e.placeName} count={e.clicks} key={i}/>
                })}
            </div>
        )
    }

    useEffect(() => {
        // fetch clicks from db
        fetch(`https://click-chaser-backend.onrender.com/locales/`)
        .then(res => res.json())
        .then(data => {
            setClickData(
                data.sort((a,b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
                .map(e => ({placeName: e.placeName, clicks: e.clicks}))
            )
        });

        // Request Location
        const permissionGranted = position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.REACT_APP_GOOGLE_MAPS_KEY}`)
            .then(res => res.json())
            .then(data => {
                let components = data.results[0].address_components;
                
                const locality = components.find(e => e.types.includes('locality')).short_name;
                const area = components.find(e => e.types.includes('administrative_area_level_1')).short_name;
                const country = components.find(e => e.types.includes('country')).short_name;

                setPlaceName(`${locality}_${area}_${country}`);
            })
        }

        const permissionDenied = error => {
            setPlaceName('Undisclosed Location');
        }

        navigator.geolocation.getCurrentPosition(permissionGranted, permissionDenied);
    }, []);
    

    const totalClicks = clickData.reduce((a,b) => {
        return a + b.clicks
    }, 0); 

    return (
        <div className='chasing-clicks'>
            <div className='btn' onClick={handleClick}>Click!</div>
            <div className='total-clicks'>Total: {totalClicks}</div>
            <ClickChart />
        </div>
    )
}