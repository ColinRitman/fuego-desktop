use libp2p::{
    core::upgrade,
    gossipsub::{self, Behaviour as GossipsubBehaviour, Config as GossipsubConfig, IdentTopic, MessageAuthenticity, IdentityTransform, AllowAllSubscriptionFilter},
    identity,
    noise,
    swarm::{Swarm, SwarmEvent},
    tcp,
    yamux,
    Multiaddr, PeerId, Transport,
};
use tokio::sync::mpsc;
use tokio::task;
use futures_util::StreamExt;

pub type EventSender = mpsc::UnboundedSender<gossipsub::Event>;

/// Start the P2P networking layer. Returns the local [`PeerId`] and a sender for swarm events.
pub async fn start_network(listen_addr: Multiaddr) -> (PeerId, EventSender) {
    // Generate keypair for this node
    let local_key = identity::Keypair::generate_ed25519();
    let peer_id = PeerId::from(local_key.public());

    // Build transport (tcp + noise + yamux)
    let transport = tcp::tokio::Transport::default()
        .upgrade(upgrade::Version::V1)
        .authenticate(noise::Config::new(&local_key).unwrap())
        .multiplex(yamux::Config::default())
        .boxed();
    // If DNS is needed and available, you can wrap with DNS here.
    // let transport = libp2p_dns::TokioDnsConfig::system(transport).unwrap();

    // Gossipsub
    let gossipsub_config = GossipsubConfig::default();
    let mut gossipsub: GossipsubBehaviour<IdentityTransform, AllowAllSubscriptionFilter> =
        GossipsubBehaviour::new(MessageAuthenticity::Signed(local_key.clone()), gossipsub_config).unwrap();
    gossipsub.subscribe(&IdentTopic::new("coldl3-gossip")).unwrap();

    // Build swarm
    let mut swarm = Swarm::new(transport, gossipsub, peer_id, libp2p::swarm::Config::with_tokio_executor());
    swarm.listen_on(listen_addr).unwrap();

    // Channel to bubble up events
    let (tx, mut rx) = mpsc::unbounded_channel();
    let tx_events = tx.clone();

    task::spawn(async move {
        loop {
            match swarm.select_next_some().await {
                SwarmEvent::Behaviour(event) => {
                    let _ = tx_events.send(event);
                }
                _ => {}
            }
        }
    });

    // Drain rx so channel stays alive (can be replaced with proper handler later)
    task::spawn(async move { while let Some(_e) = rx.recv().await {} });

    (peer_id, tx)
}
