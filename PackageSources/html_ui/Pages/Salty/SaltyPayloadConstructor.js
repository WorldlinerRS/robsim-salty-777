class SaltyPayloadConstructor {
    constructor() {
        this.paxStations = {
            firstClass: {
                name: 'FIRST CLASS',
                seats: 8,
                weight: 1482,
                pax: 0,
                paxTarget: 0,
                stationIndex: 0 + 1,
                position: 50,
                seatsRange: [1, 8],
                simVar: "PAYLOAD STATION WEIGHT:3"
            },
            businessClass: {
                name: 'BUS CLASS',
                seats: 62,
                weight: 11484,
                pax: 0,
                paxTarget: 0,
                stationIndex: 1 + 1,
                position: 15,
                seatsRange: [9, 70],
                simVar: "PAYLOAD STATION WEIGHT:4"
            },
            premiumEconomy: {
                name: 'PREMIUM ECO',
                seats: 24,
                weight: 4445,
                pax: 0,
                paxTarget: 0,
                stationIndex: 2 + 1,
                position: -5,
                seatsRange: [71, 94],
                simVar: "PAYLOAD STATION WEIGHT:5"
            },
            fowardEconomy: {
                name: 'FORWARD ECO',
                seats: 100,
                weight: 13892,
                pax: 0,
                paxTarget: 0,
                stationIndex: 3 + 1,
                position: -40,
                seatsRange: [95, 194],
                simVar: "PAYLOAD STATION WEIGHT:6"
            },
            rearEconomy: {
                name: 'REAR ECO',
                seats: 126,
                weight: 31673,
                pax: 0,
                paxTarget: 0,
                stationIndex: 4 + 1,
                position: -90,
                seatsRange: [194, 320],
                simVar: "PAYLOAD STATION WEIGHT:7"
            },
        };

        this.cargoStations = {
            fwdBag: {
                name: 'FORWARD_BAGGAGE',
                weight: 6373,
                load: 0,
                stationIndex: 5 + 1,
                position: 54,
                visible: true,
                simVar: 'PAYLOAD STATION WEIGHT:8',
            },
            aftBag: {
                name: 'REAR_BAGGAGE',
                weight: 6373,
                load: 0,
                stationIndex: 6 + 1,
                position: -60,
                visible: true,
                simVar: 'PAYLOAD STATION WEIGHT:9',
            }
        };
    }
}