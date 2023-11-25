const source = `
package main

import (
	"database/sql"
	"log"
	"net"

	pb "github.com/dev999900001111/sample-app/api/user"
	user "github.com/dev999900001111/sample-app/internal/app/user"

	_ "github.com/lib/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

const (
	port     = ":50051"
	connInfo = "user=postgres dbname=postgres sslmode=disable"
)

func main() {
	// DB接続
	db, err := sql.Open("postgres", connInfo)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Userサービスのセットアップ
	userRepo := user.NewRepository(db)
	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	// gRPCサーバのセットアップ
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	opts := []grpc.ServerOption{
		// grpc.Creds(nil), // TLS無効化
	}
	s := grpc.NewServer(opts...)
	reflection.Register(s)
	pb.RegisterUserServiceServer(s, userHandler)

	// サーバ起動
	log.Println("Starting...")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	} else {
		log.Println("Start:")
	}
}
`;
export default source.trim();