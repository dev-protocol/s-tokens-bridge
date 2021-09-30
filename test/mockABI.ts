export const mockSTokensManagerABI = [
	{
		inputs: [
			{
				internalType: 'address',
				name: 'from',
				type: 'address',
			},
			{
				internalType: 'address',
				name: 'to',
				type: 'address',
			},
			{
				internalType: 'uint256',
				name: 'tokenId',
				type: 'uint256',
			},
		],
		name: 'transferFrom',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_tokenId',
				type: 'uint256',
			},
		],
		name: 'positions',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address',
			},
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256',
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
]

export const mockSTokensManagerL2ABI = [
	{
		inputs: [
			{
				internalType: 'address',
				name: 'from',
				type: 'address',
			},
			{
				internalType: 'address',
				name: 'to',
				type: 'address',
			},
			{
				internalType: 'uint256',
				name: 'tokenId',
				type: 'uint256',
			},
		],
		name: 'transferFrom',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function',
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_tokenId',
				type: 'uint256',
			},
		],
		name: 'positions',
		outputs: [
			{
				components: [
					{
						internalType: 'address',
						name: 'property',
						type: 'address',
					},
					{
						internalType: 'uint256',
						name: 'amount',
						type: 'uint256',
					},
					{
						internalType: 'uint256',
						name: 'price',
						type: 'uint256',
					},
					{
						internalType: 'uint256',
						name: 'cumulativeReward',
						type: 'uint256',
					},
					{
						internalType: 'uint256',
						name: 'pendingReward',
						type: 'uint256',
					},
				],
				internalType: "struct ISTokensManager.StakingPositions",
				name: "",
				type: "tuple"
			},
		],
		stateMutability: 'view',
		type: 'function',
	},
]
